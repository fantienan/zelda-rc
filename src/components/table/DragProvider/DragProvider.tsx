import React, { ReactNode, FC } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import CustomDragLayer from './customDragLayer'
import '../style/index.less'

interface IDragProviderProps {
    children: ReactNode | string
}
const InternalDragProvider: FC<IDragProviderProps> = (props) => {
    return (
        <DndProvider backend={HTML5Backend}>
            {props.children}
            <CustomDragLayer />
        </DndProvider>
    )
}

export default InternalDragProvider

