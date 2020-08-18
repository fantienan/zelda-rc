import React from 'react'
import { Button } from 'antd'
import { Story, Meta } from '@storybook/react/types-6-0'
import Modal, { TModalProps } from './modal'

export default {
    title: 'Example/Modal',
    component: Modal
} as Meta

const Template: Story<TModalProps> = (args) => {
    const [visible, setVisible] = React.useState(false)
    return <>
        <Button onClick={() => setVisible(true)}>click</Button>
        <Modal
            title="标题"
            visible={visible}
            drag={args.drag}
            resizable={args.resizable}
            onOk={() => setVisible(false)}
            onCancel={() => setVisible(false)}
        >
            基础弹窗
        </Modal>
    </>
}

export const Basice = Template.bind({})

