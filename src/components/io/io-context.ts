import RequestContext from './request-context'
const rc = new RequestContext()

const context = rc.context({
  // urlPrefix: '/oa',
  // mockUrlPrefix: '',
  headers: {
    // 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  },
  // withCredentials: false,
})
export {
  RequestContext
}
export default context