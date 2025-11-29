export enum ThemeMode {
    SYSTEM = "system",
    LIGHT = "light",
    DARK = "dark",
}

export enum Theme {
    LIGHT = "light",
    DARK = "dark",
}

export interface RequestErrorSchema {
    code: number
    msg: string
    details?: string[]
}

export interface ResData<T = unknown> {
    code: number
    msg: string
    data: T
}

export interface ResListData<T = unknown> {
    code: number
    msg: string
    data: {
        list: T[]
        total: number
        page: number
        pageSize: number
        totalPages: number
    }
}

export interface ResPageData<T = unknown> {
    code: number
    msg: string
    data: {
        list: T[]
        total: number
    }
}
