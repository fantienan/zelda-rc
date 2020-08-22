import React from 'react'
import { render } from '@testing-library/react'
import Modal from './modal'

describe("测试弹窗组件", () => {
    it("测试弹出不可拖拽的弹窗", () => {
        const wapper = render(<Modal drag={false} visible={true} className="xxx"> 基础的Modal </Modal>)
        const element = wapper.getByText('基础的Modal')
        expect(element).toBeInTheDocument()
    })
    it("测试children", () => {
        const wapper = render(<Modal visible>
            子元素
        </Modal>)
        const element = wapper.queryByText('子元素')
        expect(element).toBeTruthy()
    })
})