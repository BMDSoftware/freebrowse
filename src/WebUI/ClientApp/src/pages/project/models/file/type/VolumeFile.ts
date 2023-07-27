import type { ColorMap } from '@/pages/project/models/ColorMap';
import type { CloudVolumeFile } from '@/pages/project/models/file/CloudVolumeFile';
import type { LocalVolumeFile } from '@/pages/project/models/file/LocalVolumeFile';
import type { FileType } from '@/pages/project/models/file/ProjectFile';

export type VolumeFile = CloudVolumeFile | LocalVolumeFile;

export interface IVolumeFile {
	readonly type: FileType.VOLUME;
	readonly opacity: number;

	from: (options: {
		order?: number;
		isActive?: boolean;
		isChecked?: boolean;
		colorMap?: ColorMap;
		opacity?: number;
		contrastMin?: number;
		contrastMax?: number;
		contrastMinThreshold?: number;
		contrastMaxThreshold?: number;
	}) => VolumeFile;
}
