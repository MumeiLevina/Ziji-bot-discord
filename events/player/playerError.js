const { GuildQueueEvent } = require("discord-player");
const { useLogger } = require("@zibot/zihooks");
const { EmbedBuilder } = require("discord.js");

module.exports = {
	name: GuildQueueEvent.PlayerError,
	type: "Player",

	/**
	 * @param { import('discord-player').GuildQueue } queue
	 * @param { Error } error
	 * @param { import('discord-player').Track } track
	 */

	execute: async (queue, error, track) => {
		const logger = useLogger();
		queue.player.client?.errorLog("**Player playerError**");
		queue.player.client?.errorLog(`Error: ${error.message}`);
		queue.player.client?.errorLog(`Track URL: ${track.url}`);
		logger.error(`Player Error with track: ${track.title} (${track.url})`);
		logger.error(`Error details: ${error.message}`);
		logger.error(error.stack);

		// Thông báo cho người dùng về bài hát có vấn đề
		if (queue?.metadata?.channel) {
			try {
				const embed = new EmbedBuilder()
					.setColor("Red")
					.setTitle("⚠️ Không thể phát bài hát")
					.setDescription(`Bài hát: **${track.title}** không thể phát.\nLý do: ${error.message}`)
					.setThumbnail(track.thumbnail || null)
					.setFooter({ text: "Đang chuyển sang bài tiếp theo..." });
				
				const message = await queue.metadata.channel.send({ embeds: [embed] });
				
				// Xóa thông báo sau 10 giây
				setTimeout(() => {
					message.delete().catch(() => {});
				}, 10000);
			} catch (err) {
				logger.error("Lỗi khi gửi thông báo: " + err);
			}
		}
	},
};
