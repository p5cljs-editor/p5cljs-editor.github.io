import CodeMirror from '@uiw/react-codemirror'
import { clojure } from '@nextjournal/lang-clojure'
import { useState } from 'react'
import { clearP5import, clearWindowGlobals, compileAndSet, importP5, removeDefaultCanvas } from '../utils'

const Editor = () => {
	const [source, setSource] = useState("")
	const [initialized, setInitialized] = useState(false);

	function run() {
		// CLEAR ANY STATE
		clearWindowGlobals();
		clearP5import("p5-script");
		removeDefaultCanvas()
		// PREPARE P5
		compileAndSet(source)
		importP5("p5-script");

		if (initialized) {
			// For re-running a sketch after the very first run,
			// since P5 does not automatically restart when setup()
			// is updated.
			cljs.user.setup();
		}
		if (!initialized) {
			setInitialized(true)
		}

		var targetNode = document.body;
		var config = { childList: true };
		var callback = function() {
			const p5canvas = document.getElementById("defaultCanvas0")
			if (p5canvas) {
				document.getElementById("canvas-parent").appendChild(p5canvas);
				document.querySelector("main").remove();
			}
		};
		var observer = new MutationObserver(callback);
		observer.observe(targetNode, config);
	}

	return (
		<div>
			<div id="p5-script">
			</div>
			<button onClick={run}>run</button>
			<div className="flex">
				<CodeMirror
					extensions={[clojure()]}
					onChange={e => setSource(e)}
					height="300px"
				/>
				<div id="canvas-parent"></div>
			</div>
		</div>
	)
}

export default Editor;
