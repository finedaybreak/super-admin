import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios"
import appConfig from "@/config"
import { tokenStore } from "@/store/token"
import { notificationApi } from "@/utils/notification"
import { redirect } from "react-router-dom"
import type { RequestErrorSchema } from "@/types"

interface CustomAxiosRequestConfig extends AxiosRequestConfig {
    showErrorMessage?: boolean
}

class HttpClient {
    private isLoading: boolean = false
    private loadingListeners: ((loading: boolean) => void)[] = []
    private running: number = 0
    private instance: AxiosInstance
    constructor(options?: AxiosRequestConfig) {
        this.instance = axios.create({
            ...options,
        })
        // 设置拦截器
        this.setupInterceptors()
    }

    private updateRunning(updater: ((prev: number) => number) | number) {
        if (typeof updater === "function") {
            this.running = updater(this.running)
        } else {
            this.running = updater
        }
        const newIsLoading = this.running > 0
        if (newIsLoading !== this.isLoading) {
            this.isLoading = newIsLoading
            this.loadingListeners.forEach(listener => listener(this.isLoading))
        }
    }

    public addLoadingListener(callback: (loading: boolean) => void) {
        this.loadingListeners.push(callback)
    }

    public removeLoadingListener(callback: (loading: boolean) => void) {
        this.loadingListeners = this.loadingListeners.filter(listener => listener !== callback)
    }

    // ====================== 设置拦截器 ======================
    private setupInterceptors() {
        // 请求拦截器
        this.instance.interceptors.request.use(
            config => {
                this.updateRunning(prev => prev + 1)
                const noAuthPaths = ["/auth/login", "/auth/register"]
                const url = config.url || ""
                const matched = noAuthPaths.some(path => url.endsWith(path))
                if (!matched) {
                    const token = tokenStore.getToken()
                    if (token) {
                        config.headers.Authorization = `Bearer ${token}`
                    }
                }
                return config
            },
            error => {
                this.updateRunning(prev => prev - 1)
                return Promise.reject(error)
            },
        )

        // 响应拦截器
        this.instance.interceptors.response.use(
            response => {
                this.updateRunning(prev => prev - 1)
                return response
            },
            error => {
                this.updateRunning(prev => prev - 1)
                const config = error.config as CustomAxiosRequestConfig
                const status = error.response?.status
                const serverError = error.response?.data as RequestErrorSchema
                if (config.showErrorMessage !== false && serverError) {
                    // 401 不显示错误信息
                    if (status !== 401) {
                        notificationApi().error({
                            message: serverError.msg,
                            description: serverError.details?.join("\n"),
                        })
                    }
                }
                if (status === 401) {
                    tokenStore.setToken("")
                    redirect("/login")
                }
                return Promise.reject(error)
            },
        )
    }

    // ====================== 请求方法 ======================
    async get<T = unknown>(url: string, params?: unknown, config?: CustomAxiosRequestConfig): Promise<T> {
        return this.instance.get<T>(url, { params, ...config }).then(response => response.data)
    }
    async post<T = unknown>(url: string, data?: unknown, config?: CustomAxiosRequestConfig): Promise<T> {
        return this.instance.post<T>(url, data, config).then(response => response.data)
    }
    async put<T = unknown>(url: string, data?: unknown, config?: CustomAxiosRequestConfig): Promise<T> {
        return this.instance.put<T>(url, data, config).then(response => response.data)
    }
    async delete<T = unknown>(url: string, config?: CustomAxiosRequestConfig): Promise<T> {
        return this.instance.delete<T>(url, config).then(response => response.data)
    }
    async patch<T = unknown>(url: string, data?: unknown, config?: CustomAxiosRequestConfig): Promise<T> {
        return this.instance.patch<T>(url, data, config).then(response => response.data)
    }

    // ====================== 请求方法 ======================
    // 并发请求
    public async all<T = unknown>(requests: Promise<T>[]): Promise<T[]> {
        return Promise.all(requests)
    }
    // 串行请求
    public async series<T = unknown>(requests: (() => Promise<T>)[]): Promise<T[]> {
        const results: T[] = []
        for (const request of requests) {
            const result = await request()
            results.push(result)
        }
        return results
    }

    // ====================== 工具方法 ======================
    // 获取请求唯一标识 用于处理重复请求（暂时不考虑）
    private getRequestKey(config: AxiosRequestConfig): string {
        const { method, url, params, data } = config
        return `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`
    }
}

const request = new HttpClient({
    baseURL: appConfig.apiBaseUrl,
    timeout: appConfig.apiMaxTimeout ?? 10000,
})

export default request
