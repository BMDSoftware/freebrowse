import EqualSplitView from '@/assets/EqualSplitView.svg';
import Navigate from '@/assets/Navigate.svg';
import SaveAll from '@/assets/SaveAll.svg';
import type { NiivueWrapper } from '@/pages/project/NiivueWrapper';
import { ToolButton } from '@/pages/project/components/topBar/ToolButton';
import type { ProjectState } from '@/pages/project/models/ProjectState';
import {
	ArrowUturnLeftIcon,
	ArrowUturnRightIcon,
	CircleStackIcon,
	DocumentIcon,
	ShareIcon,
} from '@heroicons/react/24/outline';
import type { LocationData } from '@niivue/niivue';
import { Store } from 'react-notifications-component';

const ICON_STYLE = 'h-7 w-7 shrink-0 text-white';

export const TopBar = ({
	projectState,
	location,
	niivueWrapper,
}: {
	projectState: ProjectState | undefined;
	location: LocationData | undefined;
	niivueWrapper: NiivueWrapper | undefined;
}): React.ReactElement => {
	const createDeepLink = (
		projectState: ProjectState | undefined,
		location: LocationData | undefined,
		niivueWrapper: NiivueWrapper | undefined
	): string => {
		let deepLink = `${window.location.origin}${window.location.pathname}?`;

		if (location !== undefined && niivueWrapper !== undefined) {
			deepLink += `sliceX=${location.vox[0]}&sliceY=${location.vox[1]}&sliceZ=${location.vox[2]}&zoom2dX=${niivueWrapper.niivue.uiData.pan2Dxyzmm[0]}&zoom2dY=${niivueWrapper.niivue.uiData.pan2Dxyzmm[1]}&zoom2dZ=${niivueWrapper.niivue.uiData.pan2Dxyzmm[2]}&zoom2d=${niivueWrapper.niivue.uiData.pan2Dxyzmm[3]}&zoom3d=${niivueWrapper.niivue.scene.volScaleMultiplier}&rasX=${location.mm[0]}&rasY=${location.mm[1]}&rasZ=${location.mm[2]}&renderAzimuth=${niivueWrapper.niivue.scene.renderAzimuth}&renderElevation=${niivueWrapper.niivue.scene.renderElevation}`;
		}

		projectState?.files.volumes.forEach((volume) => {
			deepLink += `&volumes=${encodeURIComponent(
				volume.name.toString()
			)}&volumeOpacity=${volume.opacity.toString()}&volumeOrder=${
				volume.order ?? 0
			}&volumeVisible=${volume.isChecked.toString()}&volumeSelected=${volume.isActive.toString()}&volumeContrastMin=${
				volume.contrastMin
			}&volumeContrastMax=${volume.contrastMax.toString()}&volumeColormap=${
				volume.colorMap ?? 'Gray'
			}`;
		});

		projectState?.files.surfaces.forEach((surface) => {
			deepLink += `&surfaces=${encodeURIComponent(
				surface.name
			)}&surfaceOpacity=${surface.opacity}&surfaceOrder=${
				surface.order ?? 0
			}&surfaceVisible=${surface.isChecked.toString()}&surfaceSelected=${surface.isActive.toString()}`;
		});

		return deepLink;
	};

	const displayDeeplinkCopiedNotification = (): void => {
		Store.addNotification({
			message: 'link copied to clipboard',
			type: 'success',
			insert: 'top',
			container: 'top-right',
			animationIn: ['animate__animated', 'animate__fadeIn'],
			animationOut: ['animate__animated', 'animate__fadeOut'],
			dismiss: {
				duration: 1500,
				onScreen: true,
			},
		});
	};

	return (
		<div className="flex items-baseline bg-font px-4">
			<ToolButton
				title="Load Project"
				isExpandable={true}
				icon={<DocumentIcon className={ICON_STYLE} />}
			></ToolButton>
			<ToolButton
				title="Navigate"
				isExpandable={true}
				isActive={true}
				icon={<img src={Navigate} className={ICON_STYLE} alt="Navigate" />}
			></ToolButton>
			{/* <ToolButton
				title="Edit Voxel"
				isExpandable={true}
				isActive={true}
				icon={<PencilIcon className={ICON_STYLE} />}
			></ToolButton> */}
			<ToolButton
				title="Equal Split"
				isExpandable={true}
				icon={
					<img
						src={EqualSplitView}
						className={ICON_STYLE}
						alt="EqualSplitView"
					/>
				}
			></ToolButton>
			<ToolButton
				title="PointSet"
				isExpandable={true}
				icon={<CircleStackIcon className={ICON_STYLE} />}
			></ToolButton>
			<ToolButton
				title="Save All"
				isExpandable={true}
				icon={<img src={SaveAll} className={ICON_STYLE} alt="EqualSplitView" />}
			></ToolButton>
			<ToolButton
				title="Undo"
				icon={<ArrowUturnLeftIcon className={ICON_STYLE} />}
			/>
			<ToolButton
				title="Redo"
				icon={<ArrowUturnRightIcon className={ICON_STYLE} />}
			/>
			<ToolButton
				title="Share"
				onClick={() => {
					void navigator.clipboard.writeText(
						createDeepLink(projectState, location, niivueWrapper)
					);
					displayDeeplinkCopiedNotification();
				}}
				icon={<ShareIcon className={ICON_STYLE} />}
			/>
		</div>
	);
};
