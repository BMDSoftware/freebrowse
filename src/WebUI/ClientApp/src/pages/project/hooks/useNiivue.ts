import { NiivueWrapper } from '@/pages/project/NiivueWrapper';
import { useQueueDebounced } from '@/pages/project/hooks/api/useQueueDebounced';
import {
	USER_MODE,
	type ProjectState,
} from '@/pages/project/models/ProjectState';
import { ViewSettings } from '@/pages/project/models/ViewSettings';
// import type { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import type { LocationData } from '@niivue/niivue';
import { useRef, useState, useEffect, useCallback, type Dispatch } from 'react';
import { Store } from 'react-notifications-component';
import { useQueryParams, withDefault, NumberParam } from 'use-query-params';

/**
 * this hook is the react wrapper to maintain the state of the niivue library and provide all the handles needed to interact with that library
 * LISTENS the projectState changes and PUSHES all updates to the niivue library
 */
export const useNiivue = (
	canvas: HTMLCanvasElement | null | undefined,
	projectState: ProjectState | undefined,
	setProjectState: Dispatch<
		(currentState: ProjectState | undefined) => ProjectState | undefined
	>
): {
	location: LocationData | undefined;
	niivueWrapper: NiivueWrapper | undefined;
} => {
	/**
	 * the niivueWrapper instance is keeping the reference and the state of the niivue library
	 * it will only get initialized once per project
	 */
	const niivueWrapper = useRef<NiivueWrapper | undefined>();
	const [location, setLocation] = useState<LocationData | undefined>();

	/**
	 * this flag is used to trigger a useEffect, after the niivue reference has been defined
	 */
	const [niivueWrapperInitialized, setNiivueWrapperInitialized] =
		useState(false);
	const [deeplinkInitialized, setDeeplinkInitialized] =
		useState<boolean>(false);
	const [query] = useQueryParams({
		sliceX: withDefault(NumberParam, undefined),
		sliceY: withDefault(NumberParam, undefined),
		sliceZ: withDefault(NumberParam, undefined),
		zoom3d: withDefault(NumberParam, undefined),
		zoom2d: withDefault(NumberParam, undefined),
		zoom2dX: withDefault(NumberParam, undefined),
		zoom2dY: withDefault(NumberParam, undefined),
		zoom2dZ: withDefault(NumberParam, undefined),
		rasX: withDefault(NumberParam, undefined),
		rasY: withDefault(NumberParam, undefined),
		rasZ: withDefault(NumberParam, undefined),
		renderAzimuth: withDefault(NumberParam, undefined),
		renderElevation: withDefault(NumberParam, undefined),
	});

	const {
		sliceX,
		sliceY,
		sliceZ,
		zoom3d,
		zoom2d,
		zoom2dX,
		zoom2dY,
		zoom2dZ,
		rasX,
		rasY,
		rasZ,
		renderAzimuth,
		renderElevation,
	} = query;

	/**
	 * TODO: Move this to a custom hook and remove hardcoded values
	 */
	// const [connection, setConnection] = useState<null | HubConnection>(null);

	// useEffect(() => {
	// 	const connect = new HubConnectionBuilder()
	// 		.withUrl('https://localhost:5001/PointSetsHub', {
	// 			skipNegotiation: true,
	// 			transport: 1,
	// 		})
	// 		.withAutomaticReconnect()
	// 		.build();

	// 	setConnection(connect);
	// }, []);

	// useEffect(async () => {
	// 	if (connection !== null) {
	// 		connection
	// 			.start()
	// 			.then(() => {
	// 				connection.on('PointSetUpdate', (message) => {
	// 					console.log(message);
	// 				});
	// 			})
	// 			.catch((error) => console.log(error))
	// 			.then(() => connection.invoke('JoinGroup', '4'))
	// 			.catch((error) => console.log(error));
	// 	}
	// }, [connection]);

	useEffect(() => {
		if (canvas === undefined || canvas === null) return;

		niivueWrapper.current = new NiivueWrapper(canvas);
		setNiivueWrapperInitialized(true);
		return () => {
			niivueWrapper.current = undefined;
			setNiivueWrapperInitialized(false);
		};
	}, [canvas]);

	useEffect(() => {
		if (!niivueWrapperInitialized) return;

		niivueWrapper.current?.setOnLocationChange((location) => {
			// if we do not add a timeout here, we get infinity loops in the react render procedure
			// when the user is creating new way points as fast as possible
			setTimeout(() => {
				if (location !== undefined)
					setProjectState((projectState) => {
						return projectState?.from({
							crosshairPosition: {
								x: location?.mm[0],
								y: location?.mm[1],
								z: location?.mm[2],
							},
						});
					});
				setLocation(location);
			}, 0);
		});

		niivueWrapper.current?.setOnMouseUp((uiData) => {
			setProjectState((projectState) => {
				if (projectState?.userMode !== USER_MODE.EDIT_POINTS)
					return projectState;
				if (projectState === undefined) return projectState;
				if (niivueWrapper.current === undefined) return projectState;

				const file = [
					...projectState.files.pointSets.cache,
					...projectState.files.pointSets.cloud,
					...projectState.files.pointSets.local,
				].find((file) => file.isActive);
				if (file === undefined) {
					Store.addNotification({
						message: 'you need to select a point set to add points',
						type: 'warning',
						insert: 'top',
						container: 'top-right',
						animationIn: ['animate__animated', 'animate__fadeIn'],
						animationOut: ['animate__animated', 'animate__fadeOut'],
						dismiss: {
							duration: 1500,
							onScreen: true,
						},
					});
					return projectState;
				}
				if (!file.isChecked) {
					Store.addNotification({
						message: 'the selected file needs to be visible to add points',
						type: 'warning',
						insert: 'top',
						container: 'top-right',
						animationIn: ['animate__animated', 'animate__fadeIn'],
						animationOut: ['animate__animated', 'animate__fadeOut'],
						dismiss: {
							duration: 1500,
							onScreen: true,
						},
					});
					return projectState;
				}
				if (!('data' in file) || file.data === undefined) return projectState;

				if (uiData.fracPos[0] < 0) return projectState; // not on volume
				if (uiData.mouseButtonCenterDown) return projectState;

				const position = niivueWrapper.current.coordinatesFromMouse(
					uiData.fracPos
				);

				return projectState.fromFileUpdate(
					file,
					{
						data: {
							...file.data,
							points: [
								...file.data.points,
								{
									coordinates: {
										x: position[0],
										y: position[1],
										z: position[2],
									},
									legacy_stat: 1,
								},
							],
						},
					},
					true
				);
			});
		});

		return () => {
			niivueWrapper.current?.setOnLocationChange(undefined);
			niivueWrapper.current?.setOnMouseUp(() => {
				/* do nothing */
			});
		};
	}, [setProjectState, setLocation, niivueWrapperInitialized]);

	useQueueDebounced(
		projectState,
		false,
		useCallback(
			async (previousState, nextState) => {
				if (
					niivueWrapper === undefined ||
					niivueWrapper.current === undefined ||
					niivueWrapper.current === null
				)
					return;

				if (deeplinkInitialized || rasX === undefined) {
					await niivueWrapper.current.next(previousState, nextState, undefined);
				} else {
					await niivueWrapper.current.next(
						previousState,
						nextState,
						new ViewSettings(
							zoom2d,
							zoom2dX,
							zoom2dY,
							zoom2dZ,
							zoom3d,
							sliceX,
							sliceY,
							sliceZ,
							rasX,
							rasY,
							rasZ,
							renderAzimuth,
							renderElevation
						)
					);

					setDeeplinkInitialized(true);
				}
			},
			[
				niivueWrapper,
				deeplinkInitialized,
				sliceX,
				sliceY,
				sliceZ,
				zoom3d,
				zoom2d,
				zoom2dX,
				zoom2dY,
				zoom2dZ,
				rasX,
				rasY,
				rasZ,
				renderAzimuth,
				renderElevation,
			]
		)
	);

	return {
		location,
		niivueWrapper: niivueWrapper.current,
	};
};
