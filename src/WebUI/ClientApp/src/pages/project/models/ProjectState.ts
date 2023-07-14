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
	 * all files related to the project
	 */
	public readonly files: ProjectFiles;

	constructor(
		args:
			| {
					backendState: GetProjectDto;
			  }
			| {
					projectState: ProjectState;
					userMode?: USER_MODE;
					meshThicknessOn2D?: number;
					files?: ProjectFiles;
			  },
		public readonly upload: boolean
	) {
		if ('backendState' in args) {
			if (args.backendState.id === undefined)
				throw new Error('no id given for project');
			this.id = args.backendState.id;
			this.name = args.backendState.name;
			this.userMode = USER_MODE.NAVIGATE;
			this.meshThicknessOn2D = args.backendState.meshThicknessOn2D ?? 0;
			this.files = new ProjectFiles({
				backendState: args.backendState,
			});
			return;
		}

		this.id = args.projectState.id;
		this.name = args.projectState.name;

		this.userMode = args.userMode ?? args.projectState.userMode;
		this.meshThicknessOn2D =
			args.meshThicknessOn2D ?? args.projectState.meshThicknessOn2D;
		this.files = args.files ?? args.projectState.files;
	}

	fromFiles(files: ProjectFiles, upload = true): ProjectState {
		return new ProjectState({ projectState: this, files }, upload);
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
					files: this.files.fromAdaptedVolumes(
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
					files: this.files.fromAdaptedSurfaces(
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
					files: this.files.fromAdaptedPointSets(
						this.files.pointSets.map((tmpPointSet) =>
							tmpPointSet === file ? tmpPointSet.from(options) : tmpPointSet
						)
					),
				},
				upload
			);

		throw new Error('file type unknown');
	}
}
