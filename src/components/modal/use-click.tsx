import { useEffect, useRef } from 'react';
interface IUseClick {
    visible?: boolean
    closable?: boolean
    mask?: boolean
    clickHandle: (e: MouseEvent) => void
}
const useClick = (props: IUseClick) => {
    const timer = useRef<any>()
    function clickHandle(e: MouseEvent) {
        props.clickHandle(e)
    }
    useEffect(() => {
        clearTimeout(timer.current)
        timer.current = setTimeout(() => {
            props.visible && props.closable && !props.mask && document.addEventListener('click', clickHandle)
        }, 300)
        return () => {
            clearTimeout(timer.current)
            props.closable && !props.mask && document.removeEventListener('click', clickHandle)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.visible, props.closable, props.mask])
    return null
}

export default useClick