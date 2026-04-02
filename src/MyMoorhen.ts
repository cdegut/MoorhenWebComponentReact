import { MoorhenWebComponent } from "moorhen";
import type { MainMenuEntrySubMenu, SubMenuMap } from "moorhen";

const baseUrl = "https://www.ebi.ac.uk/pdbe/entry-files";

class MyMoorhen extends MoorhenWebComponent {
    constructor() {
        super();
    }

    public onInit = () => {
        const menuSystem = this.moorhenInstance.getMenuSystem();

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
                        onClick: () => {},
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

        // menuSystem.addMainMenu(extraMainMenu, 2);
        menuSystem.addSubmenu(extraMenu);
    };

    // async fetchMolecule(url: string, molName: string) {
    //     const dispatch = this.moorhenInstance.getDispatch();
    //     const store = this.moorhenInstance.getStore();
    //     const monomerLibraryPath = this.moorhenInstance.paths.monomerLibraryPath;
    //     const commandCentre = this.moorhenInstance.getCommandCentreRef();
    //     const newMolecule = new MoorhenMolecule(commandCentre, store, monomerLibraryPath);

    //     try {
    //         await newMolecule.loadToCootFromURL(url, molName);
    //         if (newMolecule.molNo === -1) {
    //             throw new Error("Cannot read the fetched molecule...");
    //         }
    //         await newMolecule.fetchIfDirtyAndDraw("CBs");
    //         await newMolecule.addRepresentation("ligands", "/*/*/*/*");
    //         await newMolecule.centreOn("/*/*/*/*", true, true);

    //         dispatch(addMolecule(newMolecule));
    //     } catch (err) {
    //         console.warn(err);
    //         console.warn(`Cannot fetch PDB entry from ${url}, doing nothing...`);
    //     }
    // }

    // async loadPDB(pdbCode: string) {
    //     await this.fetchMolecule(`${baseUrl}/download/${pdbCode}.cif`, pdbCode);
    // }
}

customElements.define("my-moorhen", MyMoorhen);
