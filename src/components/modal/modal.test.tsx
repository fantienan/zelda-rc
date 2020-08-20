import React from 'react'
import { render } from '@testing-library/react'
import Modal from './modal'

describe("test Modal component", () => {
    it("测试弹出不可拖拽的弹窗", () => {
        const wapper = render(<Modal drag={false} visible={true} className="xxx"> 基础的Modal </Modal>)
        const element = wapper.getByText('基础的Modal')
        expect(element).toBeInTheDocument()
    })
})