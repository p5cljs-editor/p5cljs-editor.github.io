import CodeMirror from '@uiw/react-codemirror'
import { clojure } from '@nextjournal/lang-clojure'
import { useEffect, useState } from 'react'
import { clearWindowGlobals, p5Methods, assignWindowGlobals, createP5ScriptTag, removeElementById } from '../lib/p5'
import { useSearchParams } from 'react-router-dom'
import { defaultSketch, compile } from '../lib/cljs'
import { encode, decode } from "../lib/compression"
import p5 from 'p5'

const Editor = () => {
	const [source, setSource] = useState("")
	const [urlParams, setUrlParams] = useSearchParams();
	const [error, setError] = useState(null);

	useEffect(() => {
		setSource(defaultSketch)
		if (urlParams.get("sketch")) {
			setSource(decode(urlParams.get("sketch")))
		}
	}, [])

	function run() {
		stop()
		// PREPARE P5
		const compileResult = compile(source)
		if (compileResult.name != "Error") {
			removeElementById('user-sketch')

			window.cljs.user = p5Methods;

			const script = document.createElement("script")
			script.setAttribute("id", "user-sketch")
			script.innerHTML = compileResult;
			document.getElementById('editor').appendChild(script)

			assignWindowGlobals()
			setError("")
		} else {
			setError(compileResult.cause.message)
			console.error(compileResult.cause.message)
		}

		if (compileResult.name != "Error") {
			new p5()
			const p5canvas = document.getElementById('defaultCanvas0')
			if (p5canvas) {
				document.getElementById("canvas-parent").appendChild(p5canvas);
			}
			const canvasContainer = document.querySelector("main")
			if (canvasContainer) {
				canvasContainer.remove();
			}
		}

		setUrlParams({ sketch: encode(source) })
	}

	function stop() {
		clearWindowGlobals();
		removeElementById("defaultCanvas0")
	}

	return (
		<div id="editor">
			<button
				className="m-2 px-2 py-1 bg-fuchsia-600 rounded text-white font-black"
				id="run-btn"
				onClick={run}
			>run</button>
			<button
				className="m-2 px-2 py-1 bg-neutral-400 rounded text-white font-black"
				onClick={stop}
				id="stop-btn"
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
