/**
 * Created by gerard on 29/01/16.
 */
export enum PageType {
    BACKOFFICE_IN_MENU, BACKOFFICE_WITHOUT_MENU, EXTERNAL_IN_MENU, EXTERNAL_WITHOUT_MENU
}
export interface IPage {
    name:string
    type:PageType,
    css:string[],
    js:string[]
}