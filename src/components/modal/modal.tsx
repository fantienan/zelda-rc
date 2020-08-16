import React, { FC } from "react"
import { Modal as AModal } from "antd"
import { ModalProps } from 'antd/lib/modal'

export interface IBasiceModalProps {
    children?: React.ReactNode
    /**
     * 拖拽移动
    */
    drag?: boolean
}

export type TModalProps = Partial<IBasiceModalProps & ModalProps>

export const Modal: FC<TModalProps> = (props) => {
    const { children, drag, ...resetlProps } = props
    const getModalProps = () => {
        const modalProps = {
            ...resetlProps,
            mask: drag ? false : resetlProps.mask
        }
        return modalProps

    }
    return <AModal {...getModalProps()}>
        {children}
    </AModal>
}
Modal.defaultProps = {
    drag: true,
    maskClosable: false
}

export default Modal;