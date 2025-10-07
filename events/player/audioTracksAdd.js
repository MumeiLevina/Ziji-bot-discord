const { EmbedBuilder } = require("discord.js");
const { GuildQueueEvent } = require("discord-player");

module.exports = {
	name: GuildQueueEvent.AudioTracksAdd,
	type: "Player",
	execute: async (queue, tracks) => {
		// tracks là một mảng, không phải object đơn lẻ
		if (!tracks || tracks.length === 0) return;
		if (tracks[0]?.queryType === "tts") return;
		
		// Kiểm tra nếu queue chưa phát và chưa có current track
		// Điều này có nghĩa là đây là playlist đầu tiên cần được phát
		const shouldAutoPlay = !queue.currentTrack && !queue.isPlaying();
		
		const firstTrack = tracks[0];
		const embed = new EmbedBuilder()
			.setDescription(
				`Đã thêm danh sách phát: [${firstTrack?.playlist?.title || "Không có tiêu đề"}](${firstTrack?.playlist?.url || `https://soundcloud.com`}) - ${tracks.length} bài hát`,
			)
			.setThumbnail(firstTrack?.playlist?.thumbnail || null)
			.setColor("Random")
			.setTimestamp()
			.setFooter({
				text: `by: ${firstTrack?.requestedBy?.username}`,
				iconURL: firstTrack?.requestedBy?.displayAvatarURL({ size: 1024 }) ?? null,
			});
		const replied = await queue.metadata?.channel?.send({ embeds: [embed], fetchReply: true }).catch((e) => {});
		setTimeout(function () {
			replied?.delete().catch((e) => {});
		}, 5000);
		
		// Tự động phát nếu cần (chỉ khi là playlist đầu tiên)
		if (shouldAutoPlay) {
			console.log("Auto-playing first playlist in queue...");
			// Đợi một chút để tracks được thêm vào queue hoàn toàn
			setTimeout(async () => {
				try {
					if (!queue.isPlaying() && !queue.currentTrack) {
						await queue.node.play();
					}
				} catch (error) {
					console.error("Error auto-playing playlist:", error);
				}
			}, 500);
		}
	},
};
