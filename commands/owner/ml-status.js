const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const mlModule = require("../../functions/ai/ml");
const { evaluateModel } = require("../../functions/ai/ml/trainModel");
const { analyzeMessage } = require("../../functions/ai/ml/classifyMessage");
const { useConfig } = require("@zibot/zihooks");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("ml-status")
		.setDescription("Hiển thị thống kê về Machine Learning")
		.addSubcommand(subcommand =>
			subcommand
				.setName("info")
				.setDescription("Hiển thị thông tin về hệ thống ML")
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName("test")
				.setDescription("Kiểm tra phân loại tin nhắn")
				.addStringOption(option =>
					option
						.setName("message")
						.setDescription("Tin nhắn cần phân loại")
						.setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName("config")
				.setDescription("Cấu hình hệ thống ML")
				.addBooleanOption(option =>
					option
						.setName("enabled")
						.setDescription("Bật/tắt hệ thống ML")
				)
				.addNumberOption(option =>
					option
						.setName("threshold")
						.setDescription("Ngưỡng tin cậy (0.1-1.0)")
						.setMinValue(0.1)
						.setMaxValue(1.0)
				)
				.addBooleanOption(option =>
					option
						.setName("auto_train")
						.setDescription("Tự động huấn luyện")
				)
		),
	
	category: "owner", // Chỉ owner mới có thể sử dụng
	
	execute: async ({ interaction, lang }) => {
		const config = useConfig();
		
		// Kiểm tra xem người dùng có quyền owner không
		if (!config.OwnerID.includes(interaction.user.id)) {
			return interaction.reply({
				content: "❌ | Bạn không có quyền sử dụng lệnh này.",
				ephemeral: true
			});
		}
		
		const subcommand = interaction.options.getSubcommand();
		
		// Hiển thị thông tin ML
		if (subcommand === "info") {
			const mlConfig = mlModule.getConfig();
			const evaluation = evaluateModel(analyzeMessage);
			
			const embed = new EmbedBuilder()
				.setTitle("Thông tin Machine Learning")
				.setColor("Blue")
				.addFields(
					{ name: "Trạng thái", value: mlConfig.enabled ? "✅ Đã bật" : "❌ Đã tắt", inline: true },
					{ name: "Ngưỡng tin cậy", value: `${mlConfig.confidenceThreshold.toFixed(2)}`, inline: true },
					{ name: "Tự động huấn luyện", value: mlConfig.autoTrain ? "✅ Đã bật" : "❌ Đã tắt", inline: true }
				);
				
			if (evaluation) {
				embed.addFields(
					{ name: "Độ chính xác tổng thể", value: `${(evaluation.totalAccuracy * 100).toFixed(2)}%`, inline: true },
					{ name: "Độ chính xác câu hỏi", value: `${(evaluation.questionAccuracy * 100).toFixed(2)}%`, inline: true },
					{ name: "Độ chính xác chat", value: `${(evaluation.chatAccuracy * 100).toFixed(2)}%`, inline: true },
					{ name: "Mẫu câu hỏi", value: `${evaluation.questionSamples}`, inline: true },
					{ name: "Mẫu chat", value: `${evaluation.chatSamples}`, inline: true }
				);
			}
			
			return interaction.reply({ embeds: [embed] });
		}
		
		// Kiểm tra phân loại tin nhắn
		if (subcommand === "test") {
			const message = interaction.options.getString("message");
			const result = mlModule.classifyMessage(message);
			
			const embed = new EmbedBuilder()
				.setTitle("Kết quả phân loại")
				.setColor(result.type === "question" ? "Green" : "Blue")
				.addFields(
					{ name: "Tin nhắn", value: message },
					{ name: "Phân loại", value: result.type === "question" ? "❓ Câu hỏi" : "💬 Chat bình thường", inline: true },
					{ name: "Độ tin cậy", value: `${(result.confidence * 100).toFixed(2)}%`, inline: true }
				);
				
			return interaction.reply({ embeds: [embed] });
		}
		
		// Cấu hình ML
		if (subcommand === "config") {
			const enabled = interaction.options.getBoolean("enabled");
			const threshold = interaction.options.getNumber("threshold");
			const autoTrain = interaction.options.getBoolean("auto_train");
			
			const newConfig = {};
			if (enabled !== null) newConfig.enabled = enabled;
			if (threshold !== null) newConfig.confidenceThreshold = threshold;
			if (autoTrain !== null) newConfig.autoTrain = autoTrain;
			
			mlModule.updateConfig(newConfig);
			
			const currentConfig = mlModule.getConfig();
			const embed = new EmbedBuilder()
				.setTitle("Cấu hình Machine Learning")
				.setColor("Green")
				.setDescription("Cấu hình đã được cập nhật!")
				.addFields(
					{ name: "Trạng thái", value: currentConfig.enabled ? "✅ Đã bật" : "❌ Đã tắt", inline: true },
					{ name: "Ngưỡng tin cậy", value: `${currentConfig.confidenceThreshold.toFixed(2)}`, inline: true },
					{ name: "Tự động huấn luyện", value: currentConfig.autoTrain ? "✅ Đã bật" : "❌ Đã tắt", inline: true }
				);
				
			return interaction.reply({ embeds: [embed] });
		}
	}
};
