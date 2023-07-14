import { FileType } from '@/pages/project/models/file/ProjectFile';
import type { IOrderableFile } from '@/pages/project/models/file/extension/OrderableFile';
import { CachedFile } from '@/pages/project/models/file/location/CachedFile';
import type {
	IPointSetFile,
	PointSetData,
} from '@/pages/project/models/file/type/PointSetFile';
import type { NVMesh } from '@niivue/niivue';

export class CachePointSetFile
	extends CachedFile<PointSetData>
	implements IPointSetFile, IOrderableFile
{
	public readonly type = FileType.POINT_SET;
	static DEFAULT_NAME = 'New Point Set';

	constructor(
		name: string,
		/**
		 * the data wrapper is used to manage the temporary and usable data in the memory
		 * and to guide the developer to only use the defined ways to construct it and use it immutable
		 */
		dataWrapper: PointSetData,
		public readonly isActive: boolean,
		public readonly isChecked: boolean,
		public readonly order: number | undefined,
		public readonly niivueRef: NVMesh | undefined = undefined
	) {
		super(name, dataWrapper);
	}

	from(options: {
		isActive?: boolean;
		isChecked?: boolean;
		order?: number | undefined;
		dataWrapper?: PointSetData;
		niivueRef?: NVMesh;
	}): CachePointSetFile {
		return new CachePointSetFile(
			this.name,
			options.dataWrapper ?? this.dataWrapper,
			options.isActive ?? this.isActive,
			options.isChecked ?? this.isChecked,
			options.order ?? this.order,
			options.niivueRef ?? this.niivueRef
		);
	}
}
