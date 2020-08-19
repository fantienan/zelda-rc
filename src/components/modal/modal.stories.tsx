import React, { useState, useRef } from 'react'
import { Button, Input } from 'antd'
import { Story, Meta } from '@storybook/react/types-6-0'
import Modal, { TModalProps } from './modal'

export default {
	title: 'Example/Modal',
	component: Modal
} as Meta

const Template: Story<TModalProps> = (args, i) => {
	const [visible, setVisible] = useState<any>()
	const ref = useRef<any>()
	return <>
		<div ref={ref}></div>
		<Button onClick={() => setVisible(true)}>click</Button>
		<Modal
			{...args}
			visible={visible}
			onOk={() => setVisible(false)}
			onCancel={() => setVisible(false)}
			destroyOnClose
			rnd={{
				cancel: '.ant-modal-body'
			}}
			getContainer={() => ref.current}
		>
			<Input />
		</Modal>
	</>
}

export const Basice = Template.bind({})
Basice.args = {
	drag: true,
	resizable: false,
	title: "标题",
	width: 800
}

