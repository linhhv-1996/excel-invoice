// app/composables/useDb.ts
import { set, get, clear } from 'idb-keyval';

const FILE_DATA_KEY = 'excel-raw-rows';
const FILE_NAME_KEY = 'excel-file-name';

export const useDb = () => {
  /**
   * Lưu dữ liệu file Excel và tên file vào IndexedDB.
   */
  const saveSession = async (fileName: string, data: any[]) => {
    try {
      await set(FILE_NAME_KEY, fileName);
      await set(FILE_DATA_KEY, data);
    } catch (error) {
      console.error("Failed to save session to IndexedDB:", error);
      // Có thể thêm thông báo cho người dùng ở đây
    }
  };

  /**
   * Tải dữ liệu file Excel và tên file từ IndexedDB.
   */
  const loadSession = async () => {
    const fileName = await get<string>(FILE_NAME_KEY);
    const rawRows = await get<any[]>(FILE_DATA_KEY);

    if (fileName && rawRows && rawRows.length > 0) {
      return { fileName, rawRows };
    }
    return null;
  };

  /**
   * Xóa toàn bộ dữ liệu phiên làm việc.
   */
  const clearSession = async () => {
    await clear();
  };

  return {
    saveSession,
    loadSession,
    clearSession,
  };
};
