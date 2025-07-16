'use client';

import React, { useState } from 'react';
import { DndContext } from '@dnd-kit/core';
import {
  SortableTree,
  SimpleTreeItemWrapper,
  TreeItemComponentProps,
} from 'dnd-kit-sortable-tree';

interface TreeItem {
  id: string;
  name: string;
  children?: TreeItem[];
}

const initialData: TreeItem[] = [
  { id: '1', name: 'Group 1', children: [{ id: '2', name: 'Section A' }] },
  { id: '3', name: 'Group 2' },
];

const SampleTreePage = () => {
  const [items, setItems] = useState<TreeItem[]>(initialData);

  return (
    <DndContext>
      <div className="p-6 space-y-4">
        <SortableTree
          items={items}
          onItemsChanged={setItems}
          TreeItemComponent={TreeNode}
        />
        <pre>{JSON.stringify(items, null, 2)}</pre>
      </div>
    </DndContext>
  );
};

const TreeNode = React.forwardRef<
  HTMLDivElement,
  TreeItemComponentProps<TreeItem>
>(({ item, ...props }, ref) => (
  <SimpleTreeItemWrapper {...props} item={item} ref={ref}>
    <div className="p-2 border rounded bg-white w-full">
      {item.name}
    </div>
  </SimpleTreeItemWrapper>
));

export default SampleTreePage;
