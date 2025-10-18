// app/composables/useSharedState.ts
export const useExcelData = () => {
  const rawRows = useState<any[]>('rawRows', () => [])
  const fileName = useState<string>('fileName', () => 'No file selected')

  return {
    rawRows,
    fileName,
  }
}
