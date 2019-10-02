import {
    UPLOADED_SUCCESSFULLY,
    WRONG_UPLOAD,
    RESET_REQUEST_STATES,
    GET_SERIES,
    SELECT_SERIES,
    DELETE_SUCCESS,
    DELETE_FAIL
} from './actionsTypes';
import { uiStartLoading, uiStopLoading } from './index';

const rootDBUrl = "https://et3alem-w-etrafah.firebaseio.com/";

export const addSeries = (seriesInfo, token) => {
    return dispatch => {
        fetch(rootDBUrl + 'seriesInfo.json?auth=' + token, {
            method: "POST",
            body: JSON.stringify(seriesInfo)
        })
            .then(res => {
                if (res.ok) {
                    return res.json()
                } else {
                    throw (new Error());
                }
            })
            .then(__ => {
                dispatch(uploadedSuccessfully());
            })
            .catch(err => {
                console.log(err);
                dispatch(wrongUpload());
            });
    }
}

export const deleteSeries = (key, token) => {
    return dispatch => {
        dispatch(uiStartLoading());
        fetch(rootDBUrl + `seriesInfo/${key}.json?auth=` + token, {
            method: "DELETE",
        })
            .then(res => {
                if (res.ok) {
                    return res.json()
                } else {
                    throw (new Error());
                }
            })
            .then(___ => {
                dispatch(uiStopLoading());
                dispatch(deleteSuccess());
            })
            .catch(err => {
                dispatch(uiStopLoading());
                dispatch(deleteFail());
                console.log(err);
            })
    }
}

export const deleteSuccess = () => {
    return {
        type: DELETE_SUCCESS
    }
}
export const deleteFail = () => {
    return {
        type: DELETE_FAIL
    }
}

export const uploadedSuccessfully = () => {
    return {
        type: UPLOADED_SUCCESSFULLY,
    }
}

export const wrongUpload = () => {
    return {
        type: WRONG_UPLOAD,
    }
}

export const resetRequestsStates = () => {
    return {
        type: RESET_REQUEST_STATES
    }
}

export const addEpisode = (seriesName, episodeInfo) => {
    return dispatch => {
        let playlistID = episodeInfo.playlistID;
        let pageToken;
        apiCall(pageToken, playlistID, seriesName);
    }
}

function getUrl(pageToken, playListID) {
    let pt = (typeof pageToken === "undefined") ? "" : `&pageToken=${pageToken}`,
        mykey = "AIzaSyCHxJbtL8laN9_wRbfpSRlvO-jG89nJWSc",
        URL = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playListID}&key=${mykey}${pt}`;

    return URL;
}

function apiCall(npt, playlistID, seriesName) {
    fetch(getUrl(npt, playlistID))
        .then(res => {
            return res.json();
        })
        .then(parsedRes => {
            if (parsedRes.error) {
                console.log(parsedRes.error)
            } else {
                // it's a recursion
                let order = 0;
                let videosId = [];
                for (const item of parsedRes.items) {
                    videosId.push({
                        videoID: item.snippet.resourceId.videoId,
                        playListID: item.snippet.playlistId,
                        channelID: item.snippet.channelId,
                        channelTitle: item.snippet.channelTitle,
                        views: 0,
                        order: ++order,
                    });
                }
                if (parsedRes.nextPageToken) {
                    return apiCall(parsedRes.nextPageToken, playlistID)
                }

                /*
                 * Posting the array of video IDs
                 */
                console.log("seriesName: ", seriesName);

                fetch("https://et3alem-w-etrafah.firebaseio.com/allEpisodes/" + seriesName + "/playlist.json", {
                    method: "POST",
                    body: JSON.stringify(videosId)
                })
                    .then(res => res.json())
                    .then(__ => {
                        uploadedSuccessfully();
                    })
                    .catch(err => {
                        console.log(err);
                        wrongUpload();
                    });
                // resetRequestsStates();
            }
        })
        .catch(err => console.log(err))
}




export const getSeries = () => {
    return dispatch => {
        fetch(rootDBUrl + "seriesInfo.json")
            .then(res => res.json())
            .then(parsedRes => {
                const seriesInfo = [];
                for (const key in parsedRes) {
                    seriesInfo.push({
                        ...parsedRes[key],
                        key: key
                    });
                };
                // console.log("seriesINfo_key: ", seriesInfo);
                dispatch(setSeries(seriesInfo));
            })
            .catch(err => {
                console.log(err);
                /**
                 * Add here a modal to indicate that no internet connection!
                 */
            });
    }
}
export const setSeries = (series) => {
    return {
        type: GET_SERIES,
        series: series
    }
}

export const selectSeries = (seriesName) => {
    return {
        type: SELECT_SERIES,
        selectedSeries: seriesName
    }
}