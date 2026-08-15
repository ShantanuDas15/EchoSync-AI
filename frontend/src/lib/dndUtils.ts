export function moveBlock<T>(blocks: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex < 0 || fromIndex >= blocks.length || toIndex < 0 || toIndex >= blocks.length) {
    return [...blocks];
  }
  if (fromIndex === toIndex) {
    return [...blocks];
  }
  
  const newBlocks = [...blocks];
  const [draggedBlock] = newBlocks.splice(fromIndex, 1);
  newBlocks.splice(toIndex, 0, draggedBlock);
  
  return newBlocks;
}
