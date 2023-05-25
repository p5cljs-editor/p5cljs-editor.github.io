import CodeMirror from '@uiw/react-codemirror'
import { clojure } from '@nextjournal/lang-clojure'
import { useEffect, useState } from 'react'
import { clearP5import, clearWindowGlobals, compileAndSet, createP5ScriptTag, removeDefaultCanvas } from '../lib/p5'
import { useSearchParams } from 'react-router-dom'
import { strToU8, strFromU8, decompressSync, deflateSync } from 'fflate'

const defaultSketch = `(defn setup []
  (js/createCanvas 400 400))
(defn draw []
  (js/background 220))`

function encode(s) {
	const u8 = deflateSync(strToU8(s))
	return btoa(String.fromCharCode.apply(null, u8));
}

function decode(s) {
	const binaryString = atob(s)
	let bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i)
	}
	return strFromU8(decompressSync(bytes))
}

const Editor = () => {
	const [source, setSource] = useState("")
	const [initialized, setInitialized] = useState(false);
	const [urlParams, setUrlParams] = useSearchParams();
	const [error, setError] = useState(null);
	useEffect(() => {
		setSource(defaultSketch)
		if (urlParams.get("sketch")) {
			setSource(decode(urlParams.get("sketch")))
		}
	}, [])

	function run() {
		// PREPARE P5
		const error = compileAndSet(source, 'user-script')
		if (error) {
			setError(compileAndSet(source, "user-script"))
			console.error(error)
		}

		if (!initialized) {
			setInitialized(true)
			document
				.getElementById("p5-script")
				.appendChild(createP5ScriptTag())
		}

		if (initialized && !error) {
			// For re-running a sketch after the very first run,
			// since P5 does not automatically restart when setup()
			// is updated.
			cljs.user.setup();
		}

		var targetNode = document.body;
		var config = { childList: true };
		var callback = function() {
			const p5canvas = document.getElementById("defaultCanvas0")
			if (p5canvas) {
				document.getElementById("canvas-parent").appendChild(p5canvas);
			}
			const canvasContainer = document.querySelector("main")
			if (canvasContainer) {
				canvasContainer.remove();
			}
		};
		var observer = new MutationObserver(callback);
		observer.observe(targetNode, config);

		setUrlParams({ sketch: encode(source) })
	}

	function stop() {
		// CLEAR ANY STATE
		clearWindowGlobals();
		clearP5import("p5-script");
		removeDefaultCanvas()
	}

	return (
		<div>
			<div id="p5-script"></div>
			<div id="user-script"></div>
			<button
				className="m-2 px-2 py-1 bg-fuchsia-600 rounded text-white font-black"
				onClick={run}
			>run</button>
			<button
				className="m-2 px-2 py-1 bg-neutral-400 rounded text-white font-black"
				onClick={stop}
			>stop</button>
			<div className="flex justify-evenly">
				<CodeMirror
					value={source}
					extensions={[clojure()]}
					onChange={e => setSource(e)}
					height="75vh"
					className="grow shrink border border-neutral-200 w-0 rounded m-2"
				/>
				<div id="canvas-parent" className="grow shrink w-0 m-2">
				</div>
			</div>
		</div>
	)
}

export default Editor;
