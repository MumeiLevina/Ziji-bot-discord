const { EmbedBuilder } = require("discord.js");
const { GuildQueueEvent } = require("discord-player");

module.exports = {
	name: GuildQueueEvent.AudioTrackAdd,
	type: "Player",
	execute: async (queue, track) => {
		if (track?.queryType === "tts") return;
		
		// Kiểm tra nếu queue chưa phát và chưa có current track
		// Điều này có nghĩa là đây là bài đầu tiên cần được phát
		const shouldAutoPlay = !queue.currentTrack && !queue.isPlaying();
		
		const embed = new EmbedBuilder()
			.setDescription(`Đã thêm bài hát: [${track.author} - ${track?.title}](${track?.url}) \`[${track?.duration}]\``)
			.setThumbnail(track?.thumbnail)
			.setColor("Random")
			.setTimestamp()
			.setFooter({
				text: `by: ${track?.requestedBy?.username}`,
				iconURL: track?.requestedBy?.displayAvatarURL({ size: 1024 }) ?? null,
			});
		const replied = await queue.metadata?.channel?.send({ embeds: [embed], fetchReply: true }).catch((e) => {});
		setTimeout(function () {
			replied?.delete().catch((e) => {});
		}, 5000);
		
		// Tự động phát nếu cần (chỉ khi là bài đầu tiên)
		if (shouldAutoPlay) {
			console.log("Auto-playing first track in queue...");
			// Đợi một chút để track được thêm vào queue hoàn toàn
			setTimeout(async () => {
				try {
					if (!queue.isPlaying() && !queue.currentTrack) {
						await queue.node.play();
					}
				} catch (error) {
					console.error("Error auto-playing track:", error);
				}
			}, 500);
		}
	},
};
