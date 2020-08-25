import React from 'react'
import { render } from '@testing-library/react'
import Modal from './modal'
import { RND_CLS } from './config'

describe("test Modal", () => {
    it("测试弹窗visible属性", () => {
        const wrapper = render(<Modal drag={false} visible={true}> 基础的Modal </Modal>)
        const element = wrapper.getByText('基础的Modal')
        expect(element).toBeInTheDocument()
        expect(element.closest(`.${RND_CLS}`)).not.toBeInTheDocument()
    })
    it("测试弹窗children属性", () => {
        const wrapper = render(<Modal visible>子元素</Modal>)
        const element = wrapper.getByText('子元素')
        expect(element).toBeTruthy()
        expect(element.closest(`.${RND_CLS}`)).toBeInTheDocument()
    })
    it("测试弹窗className", () => {
        const wrapper = render(<Modal visible={true} className="basice-modal">
            基础弹窗
        </Modal>)
        const element = wrapper.getByText('基础弹窗')
        expect(element.closest('.basice-modal')).toBeInTheDocument()
    })
    it("测试弹窗drag属性", () => {

    })
    it("测试弹窗title属性", () => {
        const wrapper = render(<Modal
            title="标题"
            visible={true}
        >
            基础弹窗
        </Modal>)
        const element = wrapper.getByText('标题')
        expect(element).toBeInTheDocument()
    })
})