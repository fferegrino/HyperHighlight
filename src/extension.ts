import * as vscode from 'vscode';

let hyperHighlightEnabled = false;
let disposable: vscode.Disposable | undefined;


let decorationType: vscode.TextEditorDecorationType | undefined;
let dimDecorationType: vscode.TextEditorDecorationType | undefined;
let lastSelection: vscode.Selection | undefined;

export function activate(context: vscode.ExtensionContext) {
    let toggleCommand = vscode.commands.registerCommand('extension.hyperHighlight', () => {
        hyperHighlightEnabled = !hyperHighlightEnabled;

		// console.log('Auto Copy: ', hyperHighlightEnabled);

        vscode.window.showInformationMessage(`HyperHighlight: ${hyperHighlightEnabled ? 'Enabled' : 'Disabled'}`);
        
        if (hyperHighlightEnabled) {
            disposable = vscode.window.onDidChangeTextEditorSelection(handleSelectionChange);
        }else { 

			resetEditor(vscode.window.activeTextEditor!);
			if (disposable) {
            disposable.dispose();
			}
        }
    });

    context.subscriptions.push(toggleCommand);
}

function handleSelectionChange(event: vscode.TextEditorSelectionChangeEvent) {
    const editor = event.textEditor;
    const selection = editor.selection;
    
    if (!selection.isEmpty) {
        // const selectedText = editor.document.getText(selection);
        // vscode.env.clipboard.writeText(selectedText);
		highlightText(editor, selection);
		lastSelection = selection;
    } else {
		resetEditor(editor);
		lastSelection = undefined;
	}
}


function deactivateHighlight(editor: vscode.TextEditor) {
    if (decorationType) {
        editor.setDecorations(decorationType, []);
        decorationType.dispose();
        decorationType = undefined;
    }
    if (dimDecorationType) {
        editor.setDecorations(dimDecorationType, []);
        dimDecorationType.dispose();
        dimDecorationType = undefined;
    }
    lastSelection = undefined;
}

function highlightText(editor: vscode.TextEditor, selection: vscode.Selection) {
    deactivateHighlight(editor);

    // Create decoration for selected text
    decorationType = vscode.window.createTextEditorDecorationType({
        textDecoration: 'none; font-size: 1.5em; line-height: 2em;',
        fontWeight: 'bold'
    });

    // Create decoration for dimming the rest of the document
    dimDecorationType = vscode.window.createTextEditorDecorationType({
        opacity: '0.5'
    });

    // Apply decorations
    editor.setDecorations(decorationType, [selection]);

    const fullRange = new vscode.Range(
        editor.document.positionAt(0),
        editor.document.positionAt(editor.document.getText().length)
    );

    const dimRanges = [
        new vscode.Range(fullRange.start, selection.start),
        new vscode.Range(selection.end, fullRange.end)
    ];

    editor.setDecorations(dimDecorationType, dimRanges);
}


function resetEditor(editor: vscode.TextEditor) {
    // Remove all decorations
    deactivateHighlight(editor);

    // Reset the editor's view to default
    editor.setDecorations(vscode.window.createTextEditorDecorationType({}), []);

    // Optionally, you can reset the editor's configuration to default values
    // This is useful if you've changed any editor settings
    editor.options = {
        cursorStyle: vscode.TextEditorCursorStyle.Line,
        lineNumbers: vscode.TextEditorLineNumbersStyle.On,
        // Add any other editor options you want to reset
    };

    // If you've modified any workspace or user settings, you might want to reset those as well
    // vscode.workspace.getConfiguration().update('editor.fontSize', undefined, vscode.ConfigurationTarget.Global);

    // Force a re-render of the editor
    vscode.commands.executeCommand('editor.action.triggerRender');
}


export function deactivate() {

	if (vscode.window.activeTextEditor) {
        resetEditor(vscode.window.activeTextEditor);
    }
    if (disposable) {
        disposable.dispose();
    }
}
