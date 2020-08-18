import React from 'react'
import { render } from '@testing-library/react'
import Modal from './modal'

describe("测试Modal", () => {
    it("弹出Modal", () => {
        const {container} = render( <Modal visible={true}> 基础的Modal </Modal> )
        const element = container.querySelector("ant-modal")
        expect(element).toBeInTheDocument()
    })
})