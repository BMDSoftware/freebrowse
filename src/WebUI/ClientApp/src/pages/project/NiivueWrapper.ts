import lookUpTable from './ColorMaps/LookUpTable.json';
import { type ProjectState } from '@/pages/project/models/ProjectState';
import type { ViewSettings } from '@/pages/project/models/ViewSettings';
import { niivueHandleProjectUpdate } from '@/pages/project/models/niivueUpdate/NiivueHandleProjectUpdate';
import { type LocationData, type UIData, Niivue } from '@niivue/niivue';
import type { Dispatch } from 'react';

/**
 * this class is a wrapper for the niivue library reference
 * to prevent access to a not existing reference (by not catching accesses to undefined or guards everywhere)
 * and to have the logic in a separate place to not overload the project component
 */
export class NiivueWrapper {
	public readonly niivue = new Niivue({
		show3Dcrosshair: false,
		onLocationChange: (location) =>
			this.setLocation({
				...location,
				values: location.values.map((v) => {
					return {
						...v,
						label: this.getVoxelLabel(v),
					};
				}),
			}),
		dragAndDropEnabled: false,
		dragMode: 3,
		isHighResolutionCapable: false,
		isOrientCube: false,
		enableBorderHighlight: true,
		displaySliceInfo: true,
		multiplanarForceRender: true,
	});

	private hooveredView = 0;

	constructor(
		canvasRef: HTMLCanvasElement,
		private readonly setLocation: (
			value: React.SetStateAction<LocationData | undefined>
		) => void
	) {
		this.niivue.addColormap('LookupTable', lookUpTable);
		void this.niivue.attachToCanvas(canvasRef);
	}

	public setOnMouseUp(callback: (uiData: UIData) => void): void {
		this.niivue.onMouseUp = (uiData) => callback(uiData);
	}

	coordinatesFromMouse(
		fracPos: [number]
	): ReturnType<typeof this.niivue.frac2mm> {
		return this.niivue.frac2mm(fracPos);
	}

	/**
	 * notify on project state update
	 */
	public async next(
		previousState: ProjectState | undefined,
		nextState: ProjectState,
		viewSettings: ViewSettings | undefined,
		setProjectState: Dispatch<
			(currentState: ProjectState | undefined) => ProjectState | undefined
		>
	): Promise<void> {
		await niivueHandleProjectUpdate(
			previousState,
			nextState,
			this.niivue,
			setProjectState
		);

		if (previousState === undefined) {
			await this.setViewState(viewSettings);
		}
	}

	private async setViewState(
		viewSettings: ViewSettings | undefined
	): Promise<void> {
		if (
			viewSettings?.zoom2dX !== undefined &&
			viewSettings?.zoom2dY !== undefined &&
			viewSettings?.zoom2dZ !== undefined &&
			viewSettings?.zoom2d !== undefined &&
			viewSettings?.zoom3d !== undefined &&
			viewSettings?.renderAzimuth !== undefined &&
			viewSettings?.renderElevation !== undefined
		) {
			this.niivue.uiData.pan2Dxyzmm = [
				viewSettings.zoom2dX,
				viewSettings.zoom2dY,
				viewSettings.zoom2dZ,
				viewSettings.zoom2d,
			];
			this.niivue.scene.volScaleMultiplier = viewSettings.zoom3d;
			this.niivue.scene.renderAzimuth = viewSettings.renderAzimuth;
			this.niivue.scene.renderElevation = viewSettings.renderElevation;
			this.navigateToSlice(
				viewSettings.sliceX,
				viewSettings.sliceY,
				viewSettings.sliceZ
			);
		}

		try {
			this.niivue.createOnLocationChange();
		} catch (error) {
			// something seems to fail here, but it should not stop the execution
			console.warn('ignore?!', error);
		}
		this.niivue.updateGLVolume();
	}

	static hexToRGBA(hex: string): [number, number, number, number] {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);

		return [r, g, b, 255];
	}

	static compareRgba(
		rgba255: [number, number, number, number],
		rgba: [number, number, number, number]
	): boolean {
		return (
			rgba255[0] === rgba[0] &&
			rgba255[1] === rgba[1] &&
			rgba255[2] === rgba[2] &&
			rgba255[3] === rgba[3]
		);
	}

	public handleKeyDown = (event: KeyboardEvent): void => {
		switch (event.key) {
			case 'Control':
				this.niivue.opts.dragMode = this.niivue.dragModes.none;
				break;
			case 'ArrowUp':
				this.moveSlices(1);
				break;
			case 'ArrowDown':
				this.moveSlices(-1);
				break;
			default:
				break;
		}
	};

	public handleKeyUp = (event: KeyboardEvent): void => {
		if (this.niivue === undefined) return;

		if (event.key === 'Control') {
			this.niivue.opts.dragMode = this.niivue.dragModes.pan;
		}
	};

	public handleMouseMove = (event: MouseEvent): void => {
		if (this.niivue === undefined) return;
		if (this.niivue.canvas === undefined || this.niivue.canvas === null) return;

		const rect = this.niivue.canvas.getBoundingClientRect();
		const x = (event.clientX - rect.left) * this.niivue.uiData.dpr;
		const y = (event.clientY - rect.top) * this.niivue.uiData.dpr;
		for (let i = 0; i < this.niivue.screenSlices.length; i++) {
			const axCorSag = this.niivue.screenSlices[i].axCorSag;
			if (axCorSag > 3) continue;
			const texFrac = this.niivue.screenXY2TextureFrac(x, y, i);
			if (
				texFrac[0] === undefined ||
				texFrac[0] < 0 ||
				axCorSag === this.hooveredView
			)
				continue;
			this.hooveredView = axCorSag;
		}
		if (
			this.niivue.opts.dragMode === this.niivue.dragModes.none &&
			this.niivue.uiData.mouseButtonCenterDown
		) {
			this.moveSlices(event.movementY);
		}
	};

	public moveSlices(sliceValue: number): void {
		if (this.niivue === undefined) return;

		if (this.hooveredView === 2) {
			this.niivue.moveCrosshairInVox(sliceValue, 0, 0);
		} else if (this.hooveredView === 1) {
			this.niivue.moveCrosshairInVox(0, sliceValue, 0);
		} else {
			this.niivue.moveCrosshairInVox(0, 0, sliceValue);
		}
	}

	private navigateToSlice(
		x: number | undefined,
		y: number | undefined,
		z: number | undefined
	): void {
		if (this.niivue === undefined) return;

		const calculateDistance = (
			target: number | undefined,
			dimensions: number
		): number => {
			if (target === undefined) return 0;

			const startingPoint = Math.floor(dimensions / 2);

			return target >= startingPoint
				? target - startingPoint
				: (startingPoint - target) * -1;
		};

		const distanceX = calculateDistance(x, this.niivue.vox[0]);
		const distanceY = calculateDistance(y, this.niivue.vox[1]);
		const distanceZ = calculateDistance(z, this.niivue.vox[2]);

		this.niivue.moveCrosshairInVox(distanceX, distanceY, distanceZ);
	}

	private getVoxelLabel(volumeLocationData: {
		id: string;
		mm: [number, number, number, number];
		name: string;
		value: number;
		vox: [number, number, number];
	}): string | undefined {
		const volume = this.niivue.volumes.find(
			(v) => v.name === volumeLocationData.name
		);

		if (volume?.colormapLabel?.labels === undefined) return undefined;

		const value = Math.round(
			volume.getValue(...volumeLocationData.vox, volume.frame4D)
		);

		if (value < 0 || value >= volume.colormapLabel.labels.length)
			return undefined;

		const label = volume.colormapLabel.labels[value];
		return label;
	}

	/*
	private deleteNode(XYZmm: [number, number, number]): void {
		const nodes = this.niivue.meshes[0].nodes;
		if (nodes.X.length < 1) return;

		let minDx = Number.POSITIVE_INFINITY;
		let minIdx = 0;
		// check distance of each node from clicked location
		for (let i = 0; i < nodes.X.length; i++) {
			const dx = Math.sqrt(
				Math.pow(XYZmm[0] - nodes.X[i], 2) +
					Math.pow(XYZmm[1] - nodes.Y[i], 2) +
					Math.pow(XYZmm[2] - nodes.Z[i], 2)
			);
			if (dx < minDx) {
				minDx = dx;
				minIdx = i;
			}
		}
		const tolerance = 15.0; // e.g. only 15mm from clicked location
		if (minDx > tolerance) return;
		nodes.names.splice(minIdx, 1);
		nodes.prefilled.splice(minIdx, 1);
		nodes.X.splice(minIdx, 1);
		nodes.Y.splice(minIdx, 1);
		nodes.Z.splice(minIdx, 1);
		nodes.Color.splice(minIdx, 1);
		nodes.Size.splice(minIdx, 1);
		this.niivue.meshes[0].updateMesh(this.niivue.gl);
		this.niivue.updateGLVolume();
	}

	private addNode(XYZmm: [number, number, number]): void {
		const nodes = this.niivue.meshes[0].nodes;
		console.log('Adding ', XYZmm);
		nodes.names.push('');
		nodes.prefilled.push('');
		nodes.X.push(XYZmm[0]);
		nodes.Y.push(XYZmm[1]);
		nodes.Z.push(XYZmm[2]);
		nodes.Color.push(1);
		nodes.Size.push(1);
		this.niivue.meshes[0].updateMesh(this.niivue.gl);
		this.niivue.updateGLVolume();
	}

	if (uiData.mouseButtonRightDown) this.deleteNode(XYZmm);
	else this.addNode(XYZmm);
	*/
}
