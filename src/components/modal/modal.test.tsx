import React from 'react'
import { render } from '@testing-library/react'
import Modal from './modal'

describe("测试Modal", () => {
    it("渲染一个基础的Modal", () => {
        const wapper = render(<Modal>
            基础的Modal
        </Modal>)
        const element = wapper.getByText('基础的Modal')
        expect(element).toBeInTheDocument()
    })
})