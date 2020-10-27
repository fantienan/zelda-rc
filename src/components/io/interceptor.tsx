import React from 'react'
import { Modal } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import RequestContext from "./request-context"
export interface IRes {
  code: string
  msg: string
  data: any
}
const { warning } = Modal
// 处理错误信息
export async function responseFilter(res: IRes) {
  return true
}

// 适配新接口规范的响应拦截
export async function responseInterceptor(res: IRes) {
  const {
    TOKEN_EXPIRED_CODE, TOKEN_EXPIRED_LOSE_EFFICACY,
    UC_NAME, TOKEN_NAME, responseInterceptor
  } = RequestContext.defaultProps
  if (typeof responseInterceptor === "function") {
    responseInterceptor(res)
    return res
  }
  if (res.code === TOKEN_EXPIRED_CODE) {
    TOKEN_NAME && localStorage.removeItem(TOKEN_NAME)
    UC_NAME && localStorage.removeItem(UC_NAME)
    window.location.reload(true)
  }
  if (res.code === TOKEN_EXPIRED_LOSE_EFFICACY) {
    warning({
      icon: <ExclamationCircleOutlined />,
      content: "当前账号已在其他地方登陆，请重新登陆！",
      onOk() {
        TOKEN_NAME && localStorage.removeItem(TOKEN_NAME)
        UC_NAME && localStorage.removeItem(UC_NAME)
        window.location.href = "/login"
      }
    })
  }
  return res
}

