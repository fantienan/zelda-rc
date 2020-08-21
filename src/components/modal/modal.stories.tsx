import React, { useState } from 'react'
import { Button, Input } from 'antd'
import { Story, Meta } from '@storybook/react/types-6-0'
import Modal, { TModalProps } from './modal'
import { DatePicker } from 'antd'
export default {
	title: 'Example/Modal',
	component: Modal
} as Meta

const Template: Story<TModalProps> = (args, i) => {
	const [visible, setVisible] = useState<any>()
	return <>
		<Button onClick={() => setVisible(true)}>click</Button>
		<Modal
			{...args}
			visible={visible}
			onOk={() => setVisible(false)}
			onCancel={() => setVisible(false)}
			destroyOnClose
			cancelClosableClassName={['cancel', 'cancel11']}
		>
			<Input />
			<DatePicker dropdownClassName="cancel"/>
			<DatePicker dropdownClassName="cancel11"/>
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

