import React from 'react'
import { Story, Meta } from '@storybook/react/types-6-0'
import VirtualList, { IVirtualList } from './virtualList'
import "../../common.css"

export default {
	title: 'Example/VirtualList',
	component: VirtualList
} as Meta

const Template: Story<IVirtualList> = (args) => {
	return <div style={{ width: 300, border: "1px solid rgb(170,170,170)" }}>
		<VirtualList {...args} />
	</div>
}
const data = Array.from(new Array(1000), (_, i) => ({
	label: "item-" + i,
	value: i
}))
export const Basice = Template.bind({})
Basice.args = {
	data
}

