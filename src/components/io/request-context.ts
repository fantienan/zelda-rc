import 'abortcontroller-polyfill/dist/polyfill-patch-fetch'
import request from './request'
import omit from 'omit.js'
export type KV = {
  [k: string]: any
}
export interface IBasicsOptions {
  mockUrlPrefix?: string,
  headers?: {
    Authorization?: string
  } & HeadersInit,
  withCredentials?: boolean,
}
interface ICommonOptions extends IBasicsOptions {
  urlPrefix?: string
}
interface IApi {
  [k: string]: {
    [k: string]: {
      (param: KV): {
        fetch(): any
        abort(): void
      }
    }
  }
}
export interface IApiObjOptions {
  url: string
  method: "POST" | "PUT" | "DELETE" | "GET" | "OPTIONS" | "HEAD" | "CONNECT" | "TRACE"
  formData?: boolean
}
interface IApiObj {
  [k: string]: IApiObjOptions
}

interface IController {
  [k: string]: AbortController
}

export interface IRequestContext {
  /**
   * 通用参数封装设置
   */
  commonOptions: ICommonOptions
  /**
   * 用于管理所有接口
  */
  api: IApi
  /**
   * 用于创建请求上下文，配置通用参数
   */
  context(config: ICommonOptions): IRequestContext
  /**
   * 创建接口
   */
  create(name: string, apiObj: IApiObj): void
}
type TDefaultProps = {
  SUCCESS_CODE?: string
  TOKEN_EXPIRED_CODE?: string
  TOKEN_EXPIRED_LOSE_EFFICACY?: string
  ERROR_CODE?: string
  UC_NAME?: string
  TOKEN_NAME?: string
  responseInterceptor?: (arug: any) => any
}
class RequestContext implements IRequestContext {
  static defaultProps: TDefaultProps
  static use(config: TDefaultProps) {
    RequestContext.defaultProps = {
      ...RequestContext.defaultProps,
      ...config
    }
  }
  commonOptions: ICommonOptions = {}
  api: IApi = {}
  context(config: ICommonOptions): IRequestContext {
    // 暂时request相关配置在request中，后续提到库时在config配置
    // 目前只起单例创建作用
    this.commonOptions = Object.assign({}, this.commonOptions, config)
    return this
  }
  create(name: string, apiObj: IApiObj) {
    const apiList = this.analysisApiList(apiObj, name)
    this.api[name] = apiList
  }
  // 分析各模块接口中的接口list
  analysisApiList(apiObj: IApiObj, name: string) {
    if (Object.prototype.toString.call(apiObj) !== "[object Object]") {
      throw new Error('接口定义列表类型必须为object')
    }
    const apiObjKeys = Object.keys(apiObj)
    const api$$obj: KV = {}
    apiObjKeys.forEach(apiObjKey => {
      // 如果存在urlPrefix配置，则添加
      const apiObjItem = apiObj[apiObjKey]
      const {
        urlPrefix,
        ...resetOptions
      } = this.commonOptions
      urlPrefix && (apiObj[apiObjKey]['url'] = `${urlPrefix}${apiObjItem.url}`)
      const controllerList: IController = {}
      let uid = 0
      api$$obj[apiObjKey] = (param: KV) => {
        param && Object.keys(param).forEach(k => {
          typeof param[k] === 'string' && (param[k] = param[k].trim())
        })
        // 对于手动终止的支持
        const controller = new AbortController()
        let signal = controller.signal
        controllerList[`${name}-${apiObjKey}-${++uid}`] = controller
        const { options, params } = this.getFinalOptionParam(apiObj[apiObjKey], param);
        const { formData, ...otherOptions } = options;
        let fData = this.generateFormData(formData, params);
        const body = (formData ? fData : params) as RequestInit["body"]
        return {
          fetch() {
            return request({
              signal,
              body,
              ...resetOptions,
              ...otherOptions,
            })
          },
          abort() {
            controller.abort()
          },
        }
      }
      api$$obj[apiObjKey]['abortAll'] = () => {
        const controllerListKeys = Object.keys(controllerList)
        controllerListKeys.forEach(key => {
          if (key.includes(`${name}-${apiObjKey}`)) {
            controllerList[key].abort()
            delete controllerList[key]
          }
        })
      }
    })
    return api$$obj
  }
  generateFormData(formData: boolean | undefined, params: KV) {
    if (formData && Object.values(params || {}).length) {
      let fData = new FormData();
      Object.keys(params).forEach(key => {
        fData.append(
          key,
          (params[key] && typeof params[key] === 'object') ||
            Array.isArray(params[key]) ?
            JSON.stringify(params[key]) :
            params[key]
        )
      })
      return fData
    }
  }
  // 设置restful路径
  getFinalOptionParam(options: IApiObjOptions, params: KV) {
    if (!params) return { options, params }
    const paramKeys = Object.keys(params)
    const restParams = paramKeys.filter(paramKey => paramKey.charAt(0) === ':')
    if (!restParams.length) return { options, params }
    restParams.forEach(restParam => {
      options.url = options.url.replace(new RegExp(`(${restParam})(?=/)|${restParam}$`, 'ig'), params[restParam])
    })
    return ({ options, params: omit(params, restParams) })
  }
}
RequestContext.defaultProps = {
  SUCCESS_CODE: '1000', // 成功
  TOKEN_EXPIRED_CODE: '1042', // token过期
  ERROR_CODE: '1050', // 错误
  TOKEN_EXPIRED_LOSE_EFFICACY: "1044", // 账号在其他地方登陆
  UC_NAME: '',
  TOKEN_NAME: 'token'
}
export default RequestContext