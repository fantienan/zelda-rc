import React, { useState } from 'react'
import { Button, Input, Select, DatePicker } from 'antd'
import { Story, Meta } from '@storybook/react/types-6-0'
import Modal, { IModalProps } from './modal'
import {RND_CANCEL_DRAG_CLS} from './config'
import "../../common.css"

export default {
	title: 'Example/Modal',
	component: Modal
} as Meta

const Template: Story<IModalProps> = (args, i) => {
	const [visible, setVisible] = useState<any>()
	return <>
		<Button onClick={() => setVisible(true)}>click</Button>
		<Modal
			{...args}
			visible={visible}
			onOk={() => setVisible(false)}
			onCancel={() => setVisible(false)}
		>
			<Input />
			<Select dropdownClassName={RND_CANCEL_DRAG_CLS}/>
			<DatePicker dropdownClassName={RND_CANCEL_DRAG_CLS}/>
		</Modal>
	</>
}

export const Basice = Template.bind({})
Basice.args = {
	drag: true,
	resizable: false,
	title: "标题",
	width: 800,
	mask: false
}

