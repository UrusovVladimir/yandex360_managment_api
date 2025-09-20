export const exportToCsv = (data, filename) => {
    const csvContent = convertToCsv(data)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }
  
  const convertToCsv = (data) => {
    if (data.length === 0) return ''
    
    const headers = Object.keys(data[0])
    const csvRows = []
    
    // Заголовки
    csvRows.push(headers.join(','))
    
    // Данные
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header] || ''
        return `"${value.toString().replace(/"/g, '""')}"`
      })
      csvRows.push(values.join(','))
    }
    
    return csvRows.join('\n')
  }