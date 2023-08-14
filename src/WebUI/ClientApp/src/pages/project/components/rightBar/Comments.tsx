import { Collapse } from '@/components/Collapse';
import { toIsoString } from '@/model/humanizeTimeSpan';
import { AddComment } from '@/pages/project/components/rightBar/AddComment';
import { CommentEntry } from '@/pages/project/components/rightBar/CommentEntry';
import { type ProjectState } from '@/pages/project/models/ProjectState';
import type { CloudPointSetFile } from '@/pages/project/models/file/CloudPointSetFile';
import type { IPointSetComment } from '@/pages/project/models/file/type/PointSetFile';
import { observer } from 'mobx-react-lite';
import type { ReactElement } from 'react';

export const Comments = observer(
	({
		projectState,
		pointSetFile,
		userName,
	}: {
		projectState: ProjectState;
		pointSetFile: CloudPointSetFile;
		userName: string;
	}): ReactElement => {
		return (
			<Collapse
				className="border-b border-gray py-2 text-xs"
				title={<span className="text-xs font-semibold">Comments</span>}
			>
				<>
					<div className="mt-2 flex flex-col pl-1">
						<span className="grow border-b">Overall: {pointSetFile?.name}</span>
						<div className="mt-1 flex flex-col pr-4">
							{pointSetFile?.data?.overall_quality !== undefined ? (
								<CommentEntry
									userName={userName}
									comment={pointSetFile?.data.overall_quality}
									setUserName={(userName) => projectState.setUserName(userName)}
									deleteComment={() =>
										pointSetFile.data !== undefined &&
										pointSetFile.setData({
											...pointSetFile.data,
											overall_quality: undefined,
										})
									}
									updateComment={(text) =>
										pointSetFile.data !== undefined &&
										pointSetFile.setData({
											...pointSetFile.data,
											overall_quality: text,
										})
									}
								/>
							) : (
								<AddComment
									onAdd={(message) =>
										pointSetFile.data !== undefined &&
										pointSetFile.setData({
											...pointSetFile.data,
											overall_quality: message,
										})
									}
									userName={userName}
								/>
							)}
						</div>
					</div>

					{(pointSetFile?.data?.points.length ?? 0) > 0 ? (
						<div className="mt-5 flex flex-col pl-1">
							<span className="grow border-b">
								{pointSetFile?.name}: Point #{pointSetFile?.selectedWayPoint}
							</span>
							<div className="mt-1 flex flex-col pr-4">
								{pointSetFile?.data?.points[
									pointSetFile.selectedWayPoint - 1
								]?.comments?.map((comment) => (
									<CommentEntry
										key={comment.timestamp}
										userName={comment.user}
										timestamp={comment.timestamp}
										comment={comment.text}
										deleteComment={() =>
											pointSetFile.data !== undefined &&
											pointSetFile.setData({
												...pointSetFile.data,
												points: pointSetFile.data.points.map((point, index) =>
													index === pointSetFile.selectedWayPoint - 1
														? {
																...point,
																comments: point.comments?.filter(
																	(iterateComment) => iterateComment !== comment
																),
														  }
														: point
												),
											})
										}
										updateComment={(text) =>
											pointSetFile.data !== undefined &&
											pointSetFile.setData({
												...pointSetFile.data,
												points: pointSetFile.data.points.map((point, index) =>
													index === pointSetFile.selectedWayPoint - 1
														? {
																...point,
																comments: point.comments?.map(
																	(iterateComment) =>
																		iterateComment === comment
																			? {
																					...iterateComment,
																					text,
																					edited: true,
																					timestamp: toIsoString(new Date()),
																			  }
																			: iterateComment
																),
														  }
														: point
												),
											})
										}
									/>
								))}
								<AddComment
									onAdd={(message) => {
										const newComment: IPointSetComment = {
											user: userName,
											text: message,
											timestamp: toIsoString(new Date()),
										};

										if (pointSetFile.data === undefined) return;
										pointSetFile.setData({
											...pointSetFile.data,
											points: [
												...pointSetFile.data.points.map((point, index) =>
													index === pointSetFile.selectedWayPoint - 1
														? {
																...point,
																comments:
																	point.comments !== undefined
																		? [...point.comments, newComment]
																		: [newComment],
														  }
														: point
												),
											],
										});
									}}
									userName={userName}
								/>
							</div>
						</div>
					) : (
						<></>
					)}
				</>
			</Collapse>
		);
	}
);
