/**
 * Khởi tạo Machine Learning module
 */
const { useLogger, useConfig } = require("@zibot/zihooks");
const mlModule = require('../functions/ai/ml');
const config = useConfig();

module.exports = async () => {
  try {
    // Chỉ khởi tạo ML nếu AI được bật
    if (config?.DevConfig?.ai) {
      // Khởi tạo module ML với cấu hình tuỳ chỉnh
      await mlModule.initML({
        enabled: true,
        confidenceThreshold: 0.4, // Ngưỡng tin cậy để xác định tin nhắn là câu hỏi
        autoTrain: true, // Tự động huấn luyện mô hình
        logPredictions: config?.DevConfig?.ML_DEBUG || false // Log dự đoán nếu debug được bật
      });

      useLogger().info('ML module initialized successfully');
    } else {
      useLogger().info('ML module not initialized - AI is disabled');
    }
  } catch (error) {
    useLogger().error(`Error initializing ML module: ${error.message}`);
  }
};
