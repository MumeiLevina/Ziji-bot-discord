const { EmbedBuilder } = require("discord.js");
const { GuildQueueEvent } = require("discord-player");

module.exports = {
	name: GuildQueueEvent.AudioTracksAdd,
	type: "Player",
	execute: async (queue, tracks) => {
		if (!tracks || tracks.length === 0) return;
		if (tracks[0]?.queryType === "tts") return;
		
		// Nếu queue không đang phát và có tracks, bắt đầu phát
		if (!queue.isPlaying() && queue.tracks.data.length > 0) {
			console.log("Queue not playing, starting playback...");
			try {
				await queue.node.play();
			} catch (error) {
				console.error("Error starting playback:", error);
			}
		}
		
		const embed = new EmbedBuilder()
			.setDescription(
				`Đã thêm danh sách phát: [${tracks[0]?.playlist?.title || "Không có tiêu đề"}](${tracks[0]?.playlist?.url || `https://soundcloud.com`}) - ${tracks.length} bài hát`,
			)
			.setThumbnail(tracks[0]?.playlist?.thumbnail || null)
			.setColor("Random")
			.setTimestamp()
			.setFooter({
				text: `by: ${tracks[0]?.requestedBy?.username}`,
				iconURL: tracks[0]?.requestedBy?.displayAvatarURL({ size: 1024 }) ?? null,
			});
		const replied = await queue.metadata?.channel?.send({ embeds: [embed], fetchReply: true }).catch((e) => {});
		setTimeout(function () {
			replied?.delete().catch((e) => {});
		}, 5000);
	},
};
