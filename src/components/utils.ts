interface ICSSProperties {
    [k: string]: string | number
}

const { toString } = Object.prototype
export const deepCopy = (p: any) => JSON.parse(JSON.stringify(p))
export const isArray = (p: any) => toString.call(p) === "[object Array]"
export const isObject = (p: any) => toString.call(p) === "[object Object]"
export const isElement = (p: any) => toString.call(p).slice(8, 12) === "HTML"
export const isFunction = (p: any) => (
    toString.call(p) === "[object Function]" ||
    toString.call(p) === "[object AsyncFunction]"
)
export const isString = (p: any) => toString.call(p) === "[object String]"
export const isNumber = (p: any) => toString.call(p) === "[object Number]"
export const isBoolean = (p: any) => toString.call(p) === "[object Boolean]"
export const isUndefined = (p: any) => toString.call(p) === "[object Undefined]"
export const isNull = (p: any) => toString.call(p) === "[object Null]"

// 是否是JSON字符串
export const isJSON = (str: string) => {
    if (typeof str === 'string') {
        try {
            const value = JSON.parse(str)
            return toString.call(value) === "[object Object]" || Array.isArray(value)
        } catch (e) {
            return false
        }
    }
    return false
}

export const getCookie = () => document.cookie.split(';').reduce((acc: { [k: string]: string }, cur) => {
    const [key = '', value = ''] = cur.split('=')
    acc[key.trim()] = value.trim()
    return acc
}, {})

export const setCookie = (name: string, value: any, days: number = 1) => {
    const exp = new Date()
    exp.setTime(exp.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = name + "=" + escape(value) + ";expires=" + exp.toUTCString()
}

// obj 转 string 样式
export const transStyleObjToStr = (obj: ICSSProperties) => {
    if (!isObject(obj)) {
        throw new Error('argus is must be object')
    }

    return Object.keys(obj).reduce((acc, key) => {
        acc += `${key}:${obj[key]};`
        return acc
    }, '')
}

// string 转 obj 样式
export const transStyleStrToObj = (str: string) => {
    if (!isString(str)) {
        throw new Error('argus is must be string')
    }
    return str.split(';').filter(_ => _).reduce((acc: ICSSProperties, cur) => {
        const [key = '', value = ''] = cur.split(':')
        acc[key.trim()] = value.trim()
        return acc
    }, {})
}

export default {
    deepCopy,
    isArray,
    isObject,
    isElement,
    isFunction,
    isString,
    isNumber,
    isBoolean,
    isUndefined,
    isNull,
    isJSON,
    getCookie,
    setCookie,
    transStyleObjToStr,
    transStyleStrToObj
}