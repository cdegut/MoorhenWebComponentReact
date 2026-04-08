import { addMolecule, MoorhenMolecule, MoorhenWebComponent } from "moorhen";
import type { MainMenuEntrySubMenu, SubMenuMap } from "moorhen";
import type { MoorhenWebComponentAttributes } from "moorhen";

declare module "react" {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        interface IntrinsicElements {
            "my-moorhen": MoorhenWebComponentAttributes;
        }
    }
}

const baseUrl = "https://www.ebi.ac.uk/pdbe/entry-files";

export class MyMoorhen extends MoorhenWebComponent {
    public onInit = () => {
        const menuSystem = this.moorhenInstance!.getMenuSystem();

        const extraMainMenu: MainMenuEntrySubMenu = {
            type: "sub-menu",
            label: "Extra Menu",
            icon: "MatSymAdd",
            menu: "extra-menu",
            align: 5,
        };

        const extraMenu: SubMenuMap = {
            "extra-menu": {
                label: "Extra",
                items: [
                    {
                        id: "extra-menu-1",
                        type: "item",
                        label: "Load 1BXN",
                        onClick: () => this.fetchMolecule(`${baseUrl}/1bxn.cif`, "1BXN"),
                    },
                    {
                        id: "extra-menu-2",
                        type: "item",
                        label: "Do something...",
                        onClick: () => {},
                    },
                    {
                        id: "extra-menu-3",
                        type: "item",
                        label: "Do something...",
                        onClick: () => {},
                    },
                ],
            },
        };

        menuSystem.addMainMenu(extraMainMenu, 2);
        menuSystem.addSubmenu(extraMenu);
    };

    async fetchMolecule(url: string, molName: string) {
        const moorhenInstance = this.moorhenInstance;
        if (!moorhenInstance) {
            console.warn("Moorhen instance not ready yet, cannot fetch molecule.");
            return;
        }

        const dispatch = moorhenInstance.getDispatch();
        const store = moorhenInstance.getStore();
        const monomerLibraryPath = moorhenInstance.paths.monomerLibraryPath;
        const commandCentre = moorhenInstance.getCommandCentreRef();
        const newMolecule = new MoorhenMolecule(commandCentre, store, monomerLibraryPath);

        try {
            await newMolecule.loadToCootFromURL(url, molName);
            if (newMolecule.molNo === -1) {
                throw new Error("Cannot read the fetched molecule...");
            }
            await newMolecule.fetchIfDirtyAndDraw("CBs");
            await newMolecule.addRepresentation("ligands", "/*/*/*/*");
            await newMolecule.centreOn("/*/*/*/*", true, true);

            dispatch(addMolecule(newMolecule));
        } catch (err) {
            console.warn(err);
            console.warn(`Cannot fetch PDB entry from ${url}, doing nothing...`);
        }
    }

    async loadPDB(pdbCode: string) {
        await this.fetchMolecule(`${baseUrl}/download/${pdbCode}.cif`, pdbCode);
    }
}

customElements.define("my-moorhen", MyMoorhen);
