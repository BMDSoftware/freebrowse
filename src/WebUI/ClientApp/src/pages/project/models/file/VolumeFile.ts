import type { CloudVolumeFile } from '@/pages/project/models/file/CloudVolumeFile';
import type { LocalVolumeFile } from '@/pages/project/models/file/LocalVolumeFile';
import type { FileType } from '@/pages/project/models/file/ProjectFile';

export type VolumeFile = CloudVolumeFile | LocalVolumeFile;

export interface IVolumeFile {
	type: FileType.VOLUME;

	from: (options: {
		order?: number;
		isActive?: boolean;
		isChecked?: boolean;
		colorMap?: string;
		opacity?: number;
		contrastMin?: number;
		contrastMax?: number;
	}) => VolumeFile;
}
