import * as vscode from 'vscode';

let hyperHighlightEnabled = false;
let disposable: vscode.Disposable | undefined;


let decorationType: vscode.TextEditorDecorationType | undefined;
let dimDecorationType: vscode.TextEditorDecorationType | undefined;
let lastSelection: vscode.Selection | undefined;
let statusBar: vscode.StatusBarItem;
let dimOpacity: number;
let backgroundColor: string;

export function activate(context: vscode.ExtensionContext) {
    hyperHighlightEnabled = context.globalState.get<boolean>('hyperHighlightEnabled', false);


    // Step 1: Create a StatusBarItem
    statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);

    // Step 2: Set the initial text and tooltip for the StatusBarItem
    statusBar.text = `HyperHighlight: ${hyperHighlightEnabled ? 'Enabled' : 'Disabled'}`;
    statusBar.tooltip = "Click to toggle HyperHighlight";
    statusBar.command = 'extension.hyperHighlight'; // Assuming 'extension.hyperHighlight' is the command ID

    // // Step 3: Show the StatusBarItem
    statusBar.show();

    let toggleCommand = vscode.commands.registerCommand('extension.hyperHighlight', async () => {
        hyperHighlightEnabled = !hyperHighlightEnabled;

		// Save the updated state to globalState
        await context.globalState.update('hyperHighlightEnabled', hyperHighlightEnabled);

        vscode.window.showInformationMessage(`HyperHighlight: ${hyperHighlightEnabled ? 'Enabled' : 'Disabled'}`);
        
        statusBar.text = `HyperHighlight: ${hyperHighlightEnabled ? 'Enabled' : 'Disabled'}`;
        if (hyperHighlightEnabled) {
            disposable = vscode.window.onDidChangeTextEditorSelection(handleSelectionChange);
        }else { 

			resetEditor(vscode.window.activeTextEditor!);
			if (disposable) {
            disposable.dispose();
			}
        }
    });

    if (hyperHighlightEnabled) {
        disposable = vscode.window.onDidChangeTextEditorSelection(handleSelectionChange);
    }else { 

        resetEditor(vscode.window.activeTextEditor!);
        if (disposable) {
        disposable.dispose();
        }
    }

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

    const config = vscode.workspace.getConfiguration('hyperHighlight');

  backgroundColor = config.get<string>('highlightColor') || 'yellow';
  dimOpacity = config.get<number>('dimOpacity') || 0.5;
    
    // Create decoration for selected text
    decorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: backgroundColor,
        isWholeLine: true,
        fontWeight: 'bold'
    });

    // Create decoration for dimming the rest of the document
    dimDecorationType = vscode.window.createTextEditorDecorationType({
        opacity: `${dimOpacity}`,
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


function loadSettings() {


    const config = vscode.workspace.getConfiguration('hyperHighlight');

  backgroundColor = config.get<string>('highlightColor') || 'yellow';
  dimOpacity = config.get<number>('dimOpacity') || 0.5;
}

vscode.workspace.onDidChangeConfiguration(event => {
  if (event.affectsConfiguration('hyperHighlight')) {
    loadSettings();
  }
});


export function deactivate() {

	if (vscode.window.activeTextEditor) {
        resetEditor(vscode.window.activeTextEditor);
    }
    if (disposable) {
        disposable.dispose();
    }
}
