import { FileInfo } from '@/pages/project/components/leftBar/FileInfo';
import { LoadedFiles } from '@/pages/project/components/leftBar/LoadedFiles';
import { VoxelInfo } from '@/pages/project/components/leftBar/VoxelInfo';
import type { ProjectState } from '@/pages/project/models/ProjectState';
import type { SetStateAction } from 'react';

export const LeftBar = ({
	projectState,
	setProjectState,
}: {
	projectState: ProjectState | undefined;
	setProjectState: (
		projectState: SetStateAction<ProjectState | undefined>
	) => void;
}): React.ReactElement => {
	return (
		<div className="bg-gray-100 w-[16rem] border border-gray-500 flex flex-col">
			<LoadedFiles
				projectState={projectState}
				setProjectState={setProjectState}
			></LoadedFiles>
			<FileInfo></FileInfo>
			<VoxelInfo></VoxelInfo>
		</div>
	);
};
