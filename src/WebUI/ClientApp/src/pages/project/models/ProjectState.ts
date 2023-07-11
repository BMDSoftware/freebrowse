import type { GetProjectDto } from '@/generated/web-api-client';
import { ProjectFiles } from '@/pages/project/models/ProjectFiles';
import type { ProjectFile } from '@/pages/project/models/file/ProjectFile';
import { FileType } from '@/pages/project/models/file/ProjectFile';
import type { SurfaceFile } from '@/pages/project/models/file/type/SurfaceFile';
import type { VolumeFile } from '@/pages/project/models/file/type/VolumeFile';

/**
 * The mode the user is interacting with the UI right now
 */
export enum USER_MODE {
	NAVIGATE,
	EDIT_VOXEL,
	EDIT_POINTS,
}

/**
 * class to uncouple backend dto from data used from ui
 * - keep the expected backend data state without fetching it again
 * - keep the ui state of the project in one place
 */
export class ProjectState {
	/**
	 * project id defined by the backend
	 */
	public readonly id: number;
	/**
	 * given name of the project
	 */
	public readonly name: string | undefined;
	/**
	 * the mode the user is interacting with the UI right now
	 */
	public readonly userMode: USER_MODE;
	/**
	 * thickness of the mesh on the 2d plane
	 */
	public readonly meshThicknessOn2D: number | undefined;
	/**
	 * state of data received on the last fetch
	 */
	public readonly backendState: GetProjectDto;
	/**
	 * all files related to the project
	 */
	public readonly files: ProjectFiles;

	constructor(
		initialState:
			| {
					backendState: GetProjectDto;
			  }
			| { projectState: ProjectState; projectFiles: ProjectFiles }
			| {
					id: number;
					name: string | undefined;
					userMode?: USER_MODE;
					meshThicknessOn2D?: number;
					backendStateDto: GetProjectDto;
					files: ProjectFiles;
			  },
		public readonly upload: boolean
	) {
		if ('backendState' in initialState) {
			if (initialState.backendState.id === undefined)
				throw new Error('no id given for project');
			this.id = initialState.backendState.id;
			this.name = initialState.backendState.name;
			this.userMode = USER_MODE.NAVIGATE;
			this.meshThicknessOn2D = initialState.backendState.meshThicknessOn2D ?? 0;
			this.backendState = initialState.backendState;
			this.files = new ProjectFiles({
				backendState: initialState.backendState,
			});
			return;
		}

		if ('projectState' in initialState) {
			this.id = initialState.projectState.id;
			this.name = initialState.projectState.name;
			this.userMode = initialState.projectState.userMode;
			this.meshThicknessOn2D = initialState.projectState.meshThicknessOn2D ?? 0;
			this.backendState = initialState.projectState.backendState;
			this.files = initialState.projectFiles;
			return;
		}

		if ('id' in initialState) {
			this.id = initialState.id;
			this.name = initialState.name;
			this.userMode = initialState.userMode ?? USER_MODE.NAVIGATE;
			this.meshThicknessOn2D = initialState.meshThicknessOn2D ?? 0;
			this.backendState = initialState.backendStateDto;
			this.files = initialState.files;
			return;
		}

		throw new Error('initial state is not as expected');
	}

	fromFiles(projectFiles: ProjectFiles, upload = true): ProjectState {
		return new ProjectState({ projectState: this, projectFiles }, upload);
	}

	fromQuery(
		volumes: (string | null)[],
		volumeOpacity: (string | null)[],
		volumeOrder: (string | null)[],
		volumeSelected: (string | null)[],
		volumeVisible: (string | null)[],
		volumeContrastMin: (string | null)[],
		volumeContrastMax: (string | null)[],
		volumeColormap: (string | null)[],
		surfaces: (string | null)[],
		surfaceOpacity: (string | null)[],
		surfaceOrder: (string | null)[],
		surfaceVisible: (string | null)[],
		surfaceSelected: (string | null)[],
		upload = true
	): ProjectState {
		const volumeFiles: VolumeFile[] = this.files.volumes.map((volume) => {
			const index = volumes.indexOf(volume.name);
			if (index !== -1) {
				return volume.from({
					order: Number(volumeOrder[index]),
					isActive: volumeSelected[index] === 'true',
					isChecked: volumeVisible[index] === 'true',
					opacity: Number(volumeOpacity[index]),
					colorMap: volumeColormap[index] ?? undefined,
					contrastMin: Number(volumeContrastMin[index]),
					contrastMax: Number(volumeContrastMax[index]),
				});
			}

			return volume.from({ isChecked: false });
		});

		const surfaceFiles: SurfaceFile[] = this.files.surfaces.map((surface) => {
			const index = surfaces.indexOf(surface.name);
			if (index !== -1) {
				return surface.from({
					order: Number(surfaceOrder[index]),
					isActive: surfaceSelected[index] === 'true',
					isChecked: surfaceVisible[index] === 'true',
					opacity: Number(surfaceOpacity[index]),
				});
			}

			return surface.from({ isChecked: false });
		});

		const files = this.files
			.fromAdaptedVolumes(volumeFiles)
			.fromAdaptedSurfaces(surfaceFiles);

		return this.fromFiles(files, upload);
	}

	/**
	 * to update a property of a file
	 * @param file file to update the property on
	 * @param options property value to update
	 * @param upload flag, if the change should get pushed to the backend
	 * @returns new instance of the project state
	 */
	fromFileUpdate<T_FILE_TYPE extends ProjectFile>(
		file: T_FILE_TYPE,
		options: Parameters<T_FILE_TYPE['from']>[0],
		upload: boolean
	): ProjectState {
		if (file.type === FileType.VOLUME)
			return new ProjectState(
				{
					projectState: this,
					projectFiles: this.files.fromAdaptedVolumes(
						this.files.volumes.map((tmpVolume) =>
							tmpVolume === file ? tmpVolume.from(options) : tmpVolume
						)
					),
				},
				upload
			);

		if (file.type === FileType.SURFACE)
			return new ProjectState(
				{
					projectState: this,
					projectFiles: this.files.fromAdaptedSurfaces(
						this.files.surfaces.map((tmpSurface) =>
							tmpSurface === file ? tmpSurface.from(options) : tmpSurface
						)
					),
				},
				upload
			);

		if (file.type === FileType.POINT_SET)
			return new ProjectState(
				{
					projectState: this,
					projectFiles: this.files.fromAdaptedPointSets(
						this.files.pointSets.map((tmpPointSet) =>
							tmpPointSet === file ? tmpPointSet.from(options) : tmpPointSet
						)
					),
				},
				upload
			);

		throw new Error('file type unknown');
	}

	/**
	 * to update a property of a project
	 * @param options property value to update
	 * @param upload flag, if the change should get pushed to the backend
	 * @returns new instance of the project state
	 */
	fromProjectUpdate(
		options: Partial<Omit<ProjectState, 'id' | 'name' | 'backendStateDto'>>,
		upload: boolean
	): ProjectState {
		return new ProjectState(
			{
				id: this.id,
				name: this.name,
				userMode: options.userMode ?? this.userMode,
				meshThicknessOn2D: options.meshThicknessOn2D ?? this.meshThicknessOn2D,
				backendStateDto: this.backendState,
				files: options.files ?? this.files,
			},
			upload
		);
	}
}
