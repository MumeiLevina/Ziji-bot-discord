const { EmbedBuilder } = require("discord.js");
const fs = require('fs');
const path = require('path');

// Đường dẫn đến tệp dữ liệu blackjack
const BLACKJACK_DATA_FILE = path.join(process.cwd(), 'jsons', 'blackjack_data.json');

// Đọc dữ liệu blackjack
const getBlackjackData = () => {
    try {
        if (fs.existsSync(BLACKJACK_DATA_FILE)) {
            return JSON.parse(fs.readFileSync(BLACKJACK_DATA_FILE, 'utf8'));
        }
    } catch (error) {
        console.error('Error reading blackjack data:', error);
    }
    return { players: {} };
};

module.exports.data = {
	name: "rankbj",
	description: "Xem bảng xếp hạng Blackjack",
	type: 1, // slash command
	options: [],
	integration_types: [0],
	contexts: [0, 1],
};

/**
 * @param { object } command - object command
 * @param { import("discord.js").CommandInteraction } command.interaction - interaction
 * @param { import("../../lang/vi.js") } command.lang - language
 */
module.exports.execute = async ({ interaction, lang }) => {
        await interaction.deferReply();
        
        // Đọc dữ liệu blackjack
        const blackjackData = getBlackjackData();
        
        // Nếu không có dữ liệu người chơi
        if (!blackjackData.players || Object.keys(blackjackData.players).length === 0) {
            return interaction.editReply({ content: 'Chưa có ai chơi Blackjack. Hãy thử chơi vài ván!' });
        }
        
        // Chuyển đổi dữ liệu người chơi thành mảng để sắp xếp
        const playerList = Object.entries(blackjackData.players).map(([id, data]) => ({
            id,
            ...data
        }));
        
        // Sắp xếp theo số tiền từ cao đến thấp
        playerList.sort((a, b) => b.money - a.money);
        
        // Tìm vị trí của người dùng hiện tại
        const userRank = playerList.findIndex(p => p.id === interaction.user.id) + 1;
        const userData = playerList.find(p => p.id === interaction.user.id);
        
        // Lấy top 10 người chơi
        const top10 = playerList.slice(0, 10);
        
        // Tạo embed hiển thị bảng xếp hạng
        const embed = new EmbedBuilder()
            .setTitle('Bảng Xếp Hạng Blackjack')
            .setColor('#FFD700')
            .setDescription('Top 10 người chơi giàu nhất tại bàn Blackjack')
            .setFooter({ text: `Cập nhật: ${new Date().toLocaleString('vi-VN')}` });
        
        // Thêm trường cho top 10
        let rankListText = '';
        top10.forEach((player, index) => {
            // Biểu tượng cho top 3
            const rankEmoji = index === 0 ? '👑' : 
                             index === 1 ? '🥈' :
                             index === 2 ? '🥉' : `${index + 1}.`;
            
            // Định dạng tên người chơi, tô đậm người dùng hiện tại
            const playerName = player.id === interaction.user.id ? 
                `**${player.username}**` : player.username;
            
            rankListText += `${rankEmoji} ${playerName}: ${player.money}$ `;
            
            // Thêm số trận thắng/thua
            rankListText += `(W: ${player.wins || 0}, L: ${player.losses || 0}`;
            
            // Thêm xì bàn nếu có
            if (player.blackjacks && player.blackjacks > 0) {
                rankListText += `, BJ: ${player.blackjacks}`;
            }
            
            rankListText += ')\n';
        });
        
        embed.addFields({ name: 'Top 10 Người Giàu Nhất', value: rankListText });
        
        // Nếu người dùng hiện tại không nằm trong top 10, thêm thông tin của họ
        if (userRank > 10 && userData) {
            let userInfo = `#${userRank}: **${userData.username}** - ${userData.money}$ (W: ${userData.wins || 0}, L: ${userData.losses || 0}${userData.blackjacks ? `, BJ: ${userData.blackjacks}` : ''})`;
            
            embed.addFields({
                name: 'Vị Trí Của Bạn',
                value: userInfo
            });
        }
        
        // Thêm thống kê tổng quát nếu người dùng đã chơi
        if (userData) {
            const winRate = userData.gamesPlayed > 0 ? 
                Math.round((userData.wins / userData.gamesPlayed) * 100) : 0;
            
            embed.addFields({
                name: 'Thống Kê Của Bạn',
                value: `Số dư: ${userData.money}$\nSố ván đã chơi: ${userData.gamesPlayed || 0}\nThắng/Thua/Hòa: ${userData.wins || 0}/${userData.losses || 0}/${userData.ties || 0}\nTỷ lệ thắng: ${winRate}%\nThắng lớn nhất: ${userData.highestWin || 0}$`
            });
        } else {
            embed.addFields({
                name: 'Thống Kê Của Bạn',
                value: 'Bạn chưa tham gia bất kỳ ván Blackjack nào. Hãy thử chơi vài ván!'
            });
        }
        
        await interaction.editReply({ embeds: [embed] });
    }