// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode"

// global status bar icon
let themeBarItem: vscode.StatusBarItem
let currentThemeName: string | undefined
let profiles: readonly string[] | undefined

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    const myCommandId = "appearance-profiles.themeIconClick"

    interface Theme {
        colorTheme: string | undefined
        prodIconTheme: string | undefined
        iconTheme: string | undefined
    }

    currentThemeName = context.globalState.get("currentThemeName")
    console.log("got current theme: ", currentThemeName)

    profiles = context.globalState
        .keys()
        ?.filter((val) => val != "currentThemeName")
    console.log("got stored profiles: ", profiles)

    let themeIconClick = vscode.commands.registerCommand(
        "appearance-profiles.themeIconClick",
        async () => {
            const selections = {
                option1:
                    "$(diff-insert) Create New Theme From Current Settings",
                option2: "$(find-selection) Select Theme",
                option3: "$(notebook-delete-cell) Delete Themes",
            }

            let selection: string | undefined =
                await vscode.window.showQuickPick([
                    selections.option1,
                    selections.option2,
                    selections.option3,
                ])

            if (selection === undefined) {
                return
            }

            switch (selection) {
                case selections.option1:
                    console.log("create new theme")
                    vscode.commands.executeCommand(
                        "appearance-profiles.createNewTheme"
                    )
                    break
                case selections.option2:
                    console.log("select theme")
                    vscode.commands.executeCommand(
                        "appearance-profiles.selectTheme"
                    )
                    break
                case selections.option3:
                    console.log("delete theme")
                    vscode.commands.executeCommand(
                        "appearance-profiles.deleteThemes"
                    )
                default:
                    break
            }
        }
    )

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand(
        "appearance-profiles.helloWorld",
        () => {
            // The code you place here will be executed every time your command is executed
            // Display a message box to the user
            const testTheme: any = context.globalState.get("theme")

            vscode.window.showInformationMessage(
                `Hello World from Appearance Profiles!
				${testTheme.curColorTheme}
				${testTheme.curProdIconTheme}
				${testTheme.curIconTheme}`
            )
        }
    )

    let createTheme = vscode.commands.registerCommand(
        "appearance-profiles.createNewTheme",
        async () => {
            const colorTheme: string | undefined = await vscode.workspace
                .getConfiguration()
                .get("workbench.colorTheme")
            const prodIconTheme: string | undefined = await vscode.workspace
                .getConfiguration()
                .get("workbench.productIconTheme")
            const iconTheme: string | undefined = await vscode.workspace
                .getConfiguration()
                .get("workbench.iconTheme")

            const newThemeName: string | undefined =
                await vscode.window.showInputBox({
                    placeHolder: "Give Your New Theme a Name",
                })
            if (newThemeName === undefined) {
                return
            }
            if (profiles?.includes(newThemeName)) {
                vscode.window.showErrorMessage(
                    "Profile with same name already exists"
                )
                return
            }

            // adding theme to persistant storage as well as selecting the new theme
            const theme: Theme = { colorTheme, prodIconTheme, iconTheme }
			console.log("creating theme: ", theme)
            context.globalState.update(newThemeName, theme)
            context.globalState.update("currentThemeName", newThemeName)
            currentThemeName = newThemeName

            vscode.window.showInformationMessage(
                `New profile "${newThemeName}" added`
            )

            profiles = context.globalState
                .keys()
                ?.filter((val) => val != "currentThemeName")
            updateThemeBarItem()
        }
    )

    let selectTheme = vscode.commands.registerCommand(
        "appearance-profiles.selectTheme",
        async () => {
            if (profiles === undefined || profiles.length === 0) {
                vscode.window.showErrorMessage(
                    "No profiles to select. Create one to get started!"
                )
                return
            }

            const selectedThemeName: string | undefined =
                await vscode.window.showQuickPick(profiles, {
                    placeHolder: "Select Theme",
                })
            if (selectedThemeName === undefined) {
                return
            }

            // get the selected theme property values
            const selectedTheme: Theme | undefined =
                context.globalState.get(selectedThemeName)
            if (selectedTheme === undefined) {
                console.log("Error selecting profile")
                return
            }
            const { colorTheme, prodIconTheme, iconTheme } = selectedTheme
			console.log("selected theme: ", selectedTheme)

            // update settings to match profile
            vscode.workspace
                .getConfiguration()
                .update("workbench.colorTheme", colorTheme, true)
            vscode.workspace
                .getConfiguration()
                .update("workbench.productIconTheme", prodIconTheme, true)
            vscode.workspace
                .getConfiguration()
                .update("workbench.iconTheme", iconTheme, true)

            context.globalState.update("currentThemeName", selectedThemeName)
            currentThemeName = selectedThemeName
            updateThemeBarItem()
            vscode.window.showInformationMessage(
                `Selected "${selectedThemeName}" theme`
            )
        }
    )

    let deleteThemes = vscode.commands.registerCommand(
        "appearance-profiles.deleteThemes",
        async () => {
            if (profiles === undefined || profiles.length === 0) {
                vscode.window.showErrorMessage(
                    "No profiles to delete. Create one to get started!"
                )
                return
            }

            const deletedThemes: string[] | undefined =
                await vscode.window.showQuickPick(profiles, {
                    placeHolder: "Select Themes to Delete",
                    canPickMany: true,
                })
            if (deletedThemes === undefined) {
                return
            }

            deletedThemes.map((theme) => {
                context.globalState.update(theme, undefined)
            })
            profiles = context.globalState
                .keys()
                ?.filter((val) => val != "currentThemeName")

            if (
                currentThemeName !== undefined &&
                !profiles.includes(currentThemeName)
            ) {
                context.globalState.update("currentThemeName", undefined)
                currentThemeName = undefined
            }
            updateThemeBarItem()
        }
    )

    // setting up status bar icon
    themeBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        0
    )
    themeBarItem.command = myCommandId
    themeBarItem.tooltip = "Active Theme"

    context.subscriptions.push(themeIconClick)
    context.subscriptions.push(disposable)
    context.subscriptions.push(createTheme)
    context.subscriptions.push(selectTheme)
    context.subscriptions.push(deleteThemes)
    context.subscriptions.push(themeBarItem)

    updateThemeBarItem()
}

function updateThemeBarItem(): void {
    // console.log("updating status bar icon name: ", currentThemeName)
    themeBarItem.text =
        "$(notebook-render-output) " +
        (currentThemeName === undefined
            ? "No theme selected"
            : currentThemeName)
    themeBarItem.show()
}

// This method is called when your extension is deactivated
export function deactivate() {}
