const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ComponentType, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const { useFunctions } = require("@zibot/zihooks");
const fs = require('fs');
const path = require('path');

// Hệ thống lưu trữ tiền của người chơi
const BLACKJACK_DATA_FILE = path.join(process.cwd(), 'jsons', 'blackjack_data.json');

// Khởi tạo hoặc đọc dữ liệu
const initBlackjackData = () => {
    try {
        if (fs.existsSync(BLACKJACK_DATA_FILE)) {
            return JSON.parse(fs.readFileSync(BLACKJACK_DATA_FILE, 'utf8'));
        }
    } catch (error) {
        console.error('Error reading blackjack data:', error);
    }
    return { players: {} };
};

// Lưu dữ liệu người chơi
const saveBlackjackData = (data) => {
    try {
        fs.writeFileSync(BLACKJACK_DATA_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving blackjack data:', error);
    }
};

// Lấy thông tin người chơi, nếu chưa có thì tạo mới
const getPlayerData = (userId, data, user = null) => {
    if (!data.players[userId]) {
        data.players[userId] = { 
            money: 100,
            username: user ? user.username : "Người chơi",
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            ties: 0,
            blackjacks: 0,
            highestWin: 0,
            lastPlayed: new Date().toISOString()
        };
        saveBlackjackData(data);
    } else if (user && data.players[userId].username !== user.username) {
        // Cập nhật username nếu đã thay đổi
        data.players[userId].username = user.username;
        saveBlackjackData(data);
    }
    return data.players[userId];
};

// Lấy số tiền của người chơi
const getPlayerMoney = (userId, data, user = null) => {
    return getPlayerData(userId, data, user).money;
};

// Cập nhật số tiền cho người chơi
const updatePlayerMoney = (userId, amount, data, user = null) => {
    const playerData = getPlayerData(userId, data, user);
    
    // Cập nhật số dư tiền
    playerData.money += amount;
    
    // Đảm bảo người chơi luôn có ít nhất 100$ để chơi tiếp
    if (playerData.money < 10) {
        playerData.money = 10;
    }
    
    // Cập nhật thống kê
    if (amount > 0 && amount > playerData.highestWin) {
        playerData.highestWin = amount;
    }
    
    playerData.lastPlayed = new Date().toISOString();
    
    saveBlackjackData(data);
    return playerData.money;
};

// Cập nhật thống kê trận đấu
const updatePlayerStats = (userId, result, data, user = null) => {
    const playerData = getPlayerData(userId, data, user);
    playerData.gamesPlayed += 1;
    
    if (result === "blackjack") {
        playerData.wins += 1;
        playerData.blackjacks += 1;
    } else if (result === "win") {
        playerData.wins += 1;
    } else if (result === "lose") {
        playerData.losses += 1;
    } else if (result === "tie") {
        playerData.ties += 1;
    }
    
    saveBlackjackData(data);
    return playerData;
};

module.exports.data = {
	name: "blackjack",
	description: "Chơi trò chơi blackjack với tối đa 4 người",
	type: 1, // slash command
	options: [
		{
			name: "player1",
			description: "Người chơi thứ nhất bạn muốn mời",
			type: 6,
			required: false,
		},
		{
			name: "player2",
			description: "Người chơi thứ hai bạn muốn mời",
			type: 6,
			required: false,
		},
		{
			name: "player3",
			description: "Người chơi thứ ba bạn muốn mời",
			type: 6,
			required: false,
		},
	],
	integration_types: [0],
	contexts: [0, 1],
};

/**
 * @param { object } command - object command
 * @param { import("discord.js").CommandInteraction } command.interaction - interaction
 * @param { import("../../lang/vi.js") } command.lang - language
 */
module.exports.execute = async ({ interaction, lang }) => {
	const ZiRank = useFunctions().get("ZiRank");
	
	// Lấy danh sách người chơi được mời
	const invitedPlayers = [];
	for (let i = 1; i <= 3; i++) {
		const player = interaction.options.getUser(`player${i}`);
		if (player && !player.bot && player.id !== interaction.user.id && !invitedPlayers.some(p => p.id === player.id)) {
			invitedPlayers.push(player);
		}
	}
	
	// Kiểm tra người chơi trùng lặp
	if (new Set(invitedPlayers.map(p => p.id)).size !== invitedPlayers.length) {
		return interaction.reply({ content: "Bạn không thể mời cùng một người chơi nhiều lần.", ephemeral: true });
	}
	
	// Tạo nút tham gia và từ chối
	const joinButton = new ButtonBuilder()
		.setCustomId("join_blackjack")
		.setLabel("Tham gia")
		.setStyle(ButtonStyle.Success);
		
	const declineButton = new ButtonBuilder()
		.setCustomId("decline_blackjack")
		.setLabel("Từ chối")
		.setStyle(ButtonStyle.Danger);
		
	const inviteRow = new ActionRowBuilder().addComponents(joinButton, declineButton);
	
	// Người chơi bắt đầu với người sử dụng lệnh
	const players = [interaction.user];
	const acceptedPlayers = new Set([interaction.user.id]);
	const declinedPlayers = new Set();
	
	// Gửi tin nhắn mời
	const inviteEmbed = new EmbedBuilder()
		.setTitle("Mời chơi Blackjack")
		.setDescription(`${interaction.user} đã mời bạn chơi Blackjack!\nThời gian chờ: 10 giây`)
		.setColor("#5865F2")
		.addFields(
			{ name: "Người chơi đã tham gia", value: `${interaction.user.username}`, inline: true },
			{ name: "Đã sẵn sàng", value: `1/${Math.min(4, invitedPlayers.length + 1)}`, inline: true }
		);
	
	const inviteContent = invitedPlayers.length > 0 
		? `${invitedPlayers.map(p => p.toString()).join(", ")}, bạn được mời chơi Blackjack!` 
		: "";
	
	const inviteReply = await interaction.reply({ 
		content: inviteContent, 
		embeds: [inviteEmbed], 
		components: [inviteRow],
		fetchReply: true 
	});
	
	// Tạo collector cho các nút tham gia/từ chối
	const inviteCollector = inviteReply.createMessageComponentCollector({
		componentType: ComponentType.Button,
		time: 10000, // 20 giây
	});
	
	// Xử lý phản hồi từ người chơi được mời
	inviteCollector.on("collect", async (i) => {
		// Chỉ cho phép người được mời phản hồi
		if (!invitedPlayers.some(p => p.id === i.user.id)) {
			return i.reply({ content: "Bạn không được mời tham gia trò chơi này.", ephemeral: true });
		}
		
		// Nếu đã phản hồi trước đó
		if (acceptedPlayers.has(i.user.id) || declinedPlayers.has(i.user.id)) {
			return i.reply({ content: "Bạn đã phản hồi lời mời này rồi.", ephemeral: true });
		}
		
		if (i.customId === "join_blackjack") {
			acceptedPlayers.add(i.user.id);
			players.push(i.user);
			
			// Cập nhật embed
			inviteEmbed.setFields(
				{ name: "Người chơi đã tham gia", value: players.map(p => p.username).join(", "), inline: true },
				{ name: "Đã sẵn sàng", value: `${players.length}/${Math.min(4, invitedPlayers.length + 1)}`, inline: true }
			);
			
			await i.update({ embeds: [inviteEmbed], components: [inviteRow] });
			
			// Nếu đủ 4 người, bắt đầu trò chơi ngay lập tức
			if (players.length === 4) {
				inviteCollector.stop("ready");
			}
		} else if (i.customId === "decline_blackjack") {
			declinedPlayers.add(i.user.id);
			invitedPlayers.splice(invitedPlayers.findIndex(p => p.id === i.user.id), 1);
			
			await i.update({ content: `${i.user.username} đã từ chối tham gia.`, components: [inviteRow] });
			
			// Nếu tất cả đã phản hồi (chấp nhận hoặc từ chối)
			if (acceptedPlayers.size + declinedPlayers.size >= invitedPlayers.length + 1) {
				inviteCollector.stop("ready");
			}
		}
	});
	
	// Xử lý khi hết thời gian hoặc đã sẵn sàng
	let gameStarted = false;
	inviteCollector.on("end", async (_, reason) => {
		// Tránh việc bắt đầu trò chơi nhiều lần
		if (gameStarted) return;
		gameStarted = true;
		
		// Kiểm tra nếu không có ai tham gia
		if (players.length < 1) {
			return interaction.editReply({
				content: "Không có đủ người chơi tham gia, trò chơi bị hủy.",
				embeds: [],
				components: []
			});
		}
		
		// Vô hiệu hóa các nút mời
		inviteRow.components.forEach(button => button.setDisabled(true));
		
		// Cập nhật thông báo
		await interaction.editReply({ 
			content: players.length > 1 ? `Trò chơi Blackjack có ${players.length} người chơi tham gia!` : "Trò chơi Blackjack đang bắt đầu!",
			embeds: [inviteEmbed.setDescription("Đang vào giai đoạn đặt cược...")],
			components: [inviteRow]
		});
		
		// Chuyển sang giai đoạn đặt cược
		await startBettingPhase(players);
	});
	
	// Giai đoạn đặt cược
	const startBettingPhase = async (players) => {
		// Khởi tạo dữ liệu blackjack
		const blackjackData = initBlackjackData();
		const bets = {};
		let totalPool = 0;
		
		// Tạo nút đặt cược cho từng người chơi
		const createBetButton = (playerId) => {
			return new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId(`bet_button_${playerId}`)
					.setLabel('Đặt cược')
					.setStyle(ButtonStyle.Primary)
			);
		};
		
		// Tạo embed hiển thị thông tin đặt cược
		const betEmbed = new EmbedBuilder()
			.setTitle('Blackjack - Đặt cược')
			.setDescription('Mỗi người chơi hãy nhấn nút Đặt cược để nhập số tiền muốn đặt cược.\nThời gian đặt cược: 20 giây')
			.setColor('#5865F2')
			.addFields(
				{ name: 'Tổng tiền trong quỹ', value: `${totalPool}$`, inline: false },
				...players.map(p => {
					const money = getPlayerMoney(p.id, blackjackData);
					return {
						name: p.username,
						value: `Tiền hiện có: ${money}$\nĐặt cược: Chưa đặt`,
						inline: true
					};
				})
			);
			
		// Tạo nút đặt cược cho từng người chơi
		const betComponents = players.map(p => createBetButton(p.id));
		
		// Gửi tin nhắn đặt cược
		const betMessage = await interaction.editReply({
			content: 'Giai đoạn đặt cược đã bắt đầu!',
			embeds: [betEmbed],
			components: betComponents,
			fetchReply: true
		});
		
		// Tạo collector cho các nút đặt cược
		const betCollector = betMessage.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: 20000, // 20 giây
		});
		
		betCollector.on('collect', async (i) => {
			// Chỉ cho phép người chơi trong game đặt cược
			if (!players.some(p => p.id === i.user.id)) {
				return i.reply({ content: 'Bạn không tham gia trò chơi này.', ephemeral: true });
			}
			
			// Nếu đã đặt cược rồi
			if (bets[i.user.id]) {
				return i.reply({ content: 'Bạn đã đặt cược rồi.', ephemeral: true });
			}
			
			// Tạo modal để nhập số tiền đặt cược
			const playerMoney = getPlayerMoney(i.user.id, blackjackData);
			
			// Tạo input để nhập số tiền đặt cược
			const betInput = new TextInputBuilder()
				.setCustomId('bet_amount')
				.setLabel(`Số tiền đặt cược (Tối đa: ${playerMoney}$)`)
				.setStyle(TextInputStyle.Short)
				.setMinLength(1)
				.setMaxLength(10)
				.setPlaceholder(`Nhập số tiền từ 1$ đến ${playerMoney}$`)
				.setRequired(true);
				
			// Tạo row chứa input
			const betRow = new ActionRowBuilder().addComponents(betInput);
			
			// Tạo modal
			const betModal = new ModalBuilder()
				.setCustomId(`bet_modal_${i.user.id}`)
				.setTitle(`Đặt cược Blackjack`)
				.addComponents(betRow);
			
			await i.showModal(betModal);
			
			try {
				// Chờ người dùng nhập xong
				const modalSubmit = await i.awaitModalSubmit({ time: 60000, filter: i => i.customId === `bet_modal_${i.user.id}` });
				
				// Lấy số tiền đặt cược
				const betAmountInput = modalSubmit.fields.getTextInputValue('bet_amount');
				let betAmount = parseInt(betAmountInput);
				
				// Kiểm tra giá trị đặt cược
				if (isNaN(betAmount) || betAmount <= 0) {
					return modalSubmit.reply({ content: 'Số tiền đặt cược phải là một số dương.', ephemeral: true });
				}
				
				// Giới hạn số tiền đặt cược tối đa
				if (betAmount > playerMoney) {
					betAmount = playerMoney;
					await modalSubmit.reply({ 
						content: `Số tiền đặt cược vượt quá số dư. Đặt cược tối đa: ${playerMoney}$`, 
						ephemeral: true 
					});
				} else {
					await modalSubmit.deferUpdate();
				}
				
				// Cập nhật đặt cược
				bets[i.user.id] = betAmount;
				totalPool += betAmount;
				
				// Cập nhật embed
				const updatedFields = [
					{ name: 'Tổng tiền trong quỹ', value: `${totalPool}$`, inline: false },
					...players.map(p => {
						const money = getPlayerMoney(p.id, blackjackData);
						const betStatus = bets[p.id] ? `Đã đặt: ${bets[p.id]}$` : 'Chưa đặt';
						return {
							name: p.username,
							value: `Tiền hiện có: ${money}$\n${betStatus}`,
							inline: true
						};
					})
				];
				
				betEmbed.setFields(updatedFields);
				
				// Vô hiệu hóa nút đặt cược của người đã đặt
				const playerBetButtonIndex = players.findIndex(p => p.id === i.user.id);
				if (playerBetButtonIndex !== -1) {
					betComponents[playerBetButtonIndex].components[0].setDisabled(true);
					betComponents[playerBetButtonIndex].components[0].setLabel(`Đã đặt: ${betAmount}$`);
					betComponents[playerBetButtonIndex].components[0].setStyle(ButtonStyle.Success);
				}
				
				await interaction.editReply({ embeds: [betEmbed], components: betComponents });
				
				// Nếu tất cả đã đặt cược, bắt đầu trò chơi
				if (Object.keys(bets).length === players.length) {
					betCollector.stop('ready');
				}
			} catch (error) {
				console.error('Error handling bet modal:', error);
			}
		});
		
		betCollector.on('end', async (_, reason) => {
			// Tự động đặt cược 10$ cho những ai chưa đặt
			players.forEach(p => {
				if (!bets[p.id]) {
					const playerMoney = getPlayerMoney(p.id, blackjackData);
					const defaultBet = Math.min(10, playerMoney);
					bets[p.id] = defaultBet;
					totalPool += defaultBet;
					
					// Cập nhật nút cho người chơi tự động đặt cược
					const playerIndex = players.findIndex(player => player.id === p.id);
					if (playerIndex !== -1 && betComponents[playerIndex]) {
						betComponents[playerIndex].components[0].setDisabled(true);
						betComponents[playerIndex].components[0].setLabel(`Tự động: ${defaultBet}$`);
						betComponents[playerIndex].components[0].setStyle(ButtonStyle.Secondary);
					}
				}
			});
			
			// Vô hiệu hóa tất cả các nút
			betComponents.forEach(row => {
				row.components.forEach(button => button.setDisabled(true));
			});
			
			// Cập nhật embed cuối cùng
			const finalBetFields = [
				{ name: 'Tổng tiền trong quỹ', value: `${totalPool}$`, inline: false },
				...players.map(p => {
					const money = getPlayerMoney(p.id, blackjackData);
					const isAutoBet = !bets[p.id] || bets[p.id] === 10;
					return {
						name: p.username,
						value: `Tiền hiện có: ${money}$\nĐặt cược: ${bets[p.id]}$${isAutoBet ? ' (Tự động)' : ''}`,
						inline: true
					};
				})
			];
			
			betEmbed.setFields(finalBetFields)
				.setDescription('Đặt cược hoàn tất! Trò chơi đang bắt đầu...');
				
			await interaction.editReply({
				embeds: [betEmbed],
				components: betComponents
			});
			
			// Bắt đầu trò chơi
			await startBlackjackGame(players, bets, totalPool, blackjackData);
		});
	};
	
	// Các hàm tiện ích cho trò chơi Blackjack
	const createDeck = () => {
		const suits = ["♠️", "♥️", "♦️", "♣️"];
		const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
		const deck = [];
		for (const suit of suits) {
			for (const rank of ranks) {
				deck.push({ suit, rank });
			}
		}
		return deck;
	};

	const shuffle = (array) => {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
		return array;
	};

	const handValue = (hand) => {
		let value = 0;
		let aces = 0;
		for (const card of hand) {
			if (card.rank === "A") {
				value += 11;
				aces += 1;
			} else if (["K", "Q", "J"].includes(card.rank)) {
				value += 10;
			} else {
				value += Number(card.rank);
			}
		}
		while (value > 21 && aces){
			value -= 10;
			aces -= 1;
		}
		return value;
	};

	const formatHand = (hand) => hand.map((c) => `${c.rank}${c.suit}`).join(" ");
	
	// Hàm chính để bắt đầu và quản lý trò chơi
	const startBlackjackGame = async (players, bets, totalPool, blackjackData) => {
		const deck = shuffle(createDeck());
		const dealerHand = [deck.pop(), deck.pop()];
		const dealerState = { blackjack: false, natural21: false };
		
		if (dealerHand[0].rank === "A" && dealerHand[1].rank === "A") {
			dealerState.blackjack = true;
		} else if (handValue(dealerHand) === 21) {
			dealerState.natural21 = true;
		}
		
		const playerHands = {};
		const playerStates = {};
		const playerValues = {};
		
		players.forEach((p) => {
			const hand = [deck.pop(), deck.pop()];
			playerHands[p.id] = hand;
			const state = { stand: false, bust: false, blackjack: false, natural21: false };
			
			if (hand[0].rank === "A" && hand[1].rank === "A") {
				state.blackjack = true;
				state.stand = true;
			} else if (handValue(hand) === 21) {
				state.natural21 = true;
				state.stand = true;
			}
			
			playerStates[p.id] = state;
			playerValues[p.id] = handValue(hand);
		});

		const buttons = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId("hit").setLabel("Rút").setStyle(ButtonStyle.Primary),
			new ButtonBuilder().setCustomId("stand").setLabel("Dừng").setStyle(ButtonStyle.Danger),
		);
		
		let currentPlayerIndex = 0;
		const advanceToNextPlayer = () => {
			while (currentPlayerIndex < players.length && playerStates[players[currentPlayerIndex].id].stand) {
				currentPlayerIndex++;
			}
		};
		advanceToNextPlayer();

		const renderDescription = (revealDealer = false) => {
			const lines = players.map((p, index) => {
				const hand = playerHands[p.id];
				const state = playerStates[p.id];
				const total = state.blackjack ? "Xì bàn" : handValue(hand);
				
				// Đánh dấu người chơi hiện tại
				const currentPlayerMark = (index === currentPlayerIndex && !revealDealer) ? "➤ " : "";
				
				// Hiển thị trạng thái người chơi
				let statusText = "";
				if (state.stand && !state.blackjack && !state.natural21 && !state.bust) statusText = " (Dừng)";
				else if (state.bust) statusText = " (Quá 21)";
				
				// Hiển thị số tiền đặt cược
				const betAmount = bets[p.id];
				return `${currentPlayerMark}**Bài của ${p.toString()}**: ${formatHand(hand)} (Tổng: ${total})${statusText} [Cược: ${betAmount}$]`;
			});
			
			const dealerTotal = dealerState.blackjack ? "Xì bàn" : handValue(dealerHand);
			const dealerShown = revealDealer ? 
				`${formatHand(dealerHand)} (Tổng: ${dealerTotal})` : 
				`${formatHand([dealerHand[0]])} ??`;
			
			lines.push(`**Bài của nhà cái**: ${dealerShown}`);
			lines.push(`**Tổng tiền trong quỹ**: ${totalPool}$`);
			
			if (!revealDealer && currentPlayerIndex < players.length) {
				lines.push(`\n**Lượt của ${players[currentPlayerIndex]}**`);
			}

			return lines.join("\n");
		};

		let embed = new EmbedBuilder()
			.setTitle(`Blackjack (${players.length} người chơi)`)
			.setColor("#5865F2")
			.setDescription(renderDescription());
			
		const message = await interaction.editReply({
			content: `Trò chơi Blackjack đã bắt đầu với ${players.length} người chơi!`,
			embeds: [embed],
			components: [buttons]
		});

		const collector = message.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: 60000,
		});

		const endGame = async (fields) => {
			buttons.components.forEach((btn) => btn.setDisabled(true));

			embed = new EmbedBuilder()
				.setTitle(`Blackjack (${players.length} người chơi)`)
				.setColor("#5865F2")
				.setDescription(renderDescription(true))
				.addFields(fields);
				
			await interaction.editReply({ embeds: [embed], components: [buttons] });
			collector.stop("finished");
		};
		
		const nextPlayer = async () => {
			currentPlayerIndex++;
			advanceToNextPlayer();
			if (currentPlayerIndex >= players.length) {
				await dealerTurn();
			} else {
				embed = EmbedBuilder.from(embed).setDescription(renderDescription());
				await interaction.editReply({ embeds: [embed], components: [buttons] });
			}
		};

		const dealerTurn = async () => {
			while (!dealerState.blackjack && !dealerState.natural21 && handValue(dealerHand) < 17) {
				dealerHand.push(deck.pop());
			}
			
			const dealerTotal = handValue(dealerHand);
			
			// Cập nhật giá trị bài cuối cùng của mỗi người chơi
			players.forEach(p => {
				if (!playerStates[p.id].bust) {
					playerValues[p.id] = handValue(playerHands[p.id]);
				} else {
					playerValues[p.id] = 0; // Người chơi quá 21 điểm sẽ có giá trị 0
				}
			});
			
			// Xác định kết quả và tính toán tiền thưởng
			const winningPlayers = [];
			const blackjackPlayers = [];
			const natural21Players = [];
			const losePlayers = [];
			const tiePlayers = [];
			
			const results = players.map((p) => {
				const hand = playerHands[p.id];
				const total = handValue(hand);
				const state = playerStates[p.id];
				let result;
				
				if (state.blackjack) {
					result = dealerState.blackjack ? "tie" : "blackjack";
					if (result === "blackjack") blackjackPlayers.push(p);
					else tiePlayers.push(p);
				} else if (dealerState.blackjack) {
					result = "lose";
					losePlayers.push(p);
				} else if (state.bust) {
					result = "lose";
					losePlayers.push(p);
				} else if (dealerState.natural21) {
					result = state.natural21 ? "tie" : "lose";
					if (result === "tie") tiePlayers.push(p);
					else losePlayers.push(p);
				} else if (state.natural21) {
					result = dealerTotal === 21 ? "tie" : "win";
					if (result === "win") natural21Players.push(p);
					else tiePlayers.push(p);
				} else if (dealerTotal > 21 || total > dealerTotal) {
					result = "win";
					winningPlayers.push(p);
				} else if (total === dealerTotal) {
					result = "tie";
					tiePlayers.push(p);
				} else {
					result = "lose";
					losePlayers.push(p);
				}
				
				return { user: p, result, total: state.bust ? 0 : total };
			});
			
			// Tính toán phần thưởng dựa trên kết quả
			let remainingPool = totalPool;
			const rewards = {};
			
			// Xử lý người chơi có blackjack (ưu tiên cao nhất, thắng toàn bộ quỹ nếu có)
			if (blackjackPlayers.length > 0) {
				const blackjackReward = Math.floor(remainingPool / blackjackPlayers.length);
				blackjackPlayers.forEach(p => {
					rewards[p.id] = bets[p.id] + blackjackReward;
					updatePlayerMoney(p.id, blackjackReward, blackjackData, p);
					updatePlayerStats(p.id, "blackjack", blackjackData, p);
					remainingPool = 0; // Lấy hết quỹ
				});
			}
			// Xử lý người chơi có 21 điểm tự nhiên
			else if (natural21Players.length > 0) {
				const natural21Reward = Math.floor(remainingPool / natural21Players.length);
				natural21Players.forEach(p => {
					rewards[p.id] = bets[p.id] + natural21Reward;
					updatePlayerMoney(p.id, natural21Reward, blackjackData, p);
					updatePlayerStats(p.id, "win", blackjackData, p);
					remainingPool = 0; // Lấy hết quỹ
				});
			}
			// Xử lý những người chơi thắng thông thường
			else if (winningPlayers.length > 0) {
				// Sắp xếp người thắng theo điểm số từ thấp đến cao
				// Người có điểm thấp hơn sẽ thắng nhiều hơn
				winningPlayers.sort((a, b) => playerValues[a.id] - playerValues[b.id]);
				
				// Tổng số điểm đảo ngược (điểm càng thấp, hệ số càng cao)
				const totalInversePoints = winningPlayers.reduce((sum, p) => {
					// Công thức tính hệ số: 22 - điểm số (nên điểm thấp hơn sẽ có hệ số cao hơn)
					const inversePoints = 22 - playerValues[p.id];
					return sum + inversePoints;
				}, 0);
				
				winningPlayers.forEach(p => {
					const inversePoints = 22 - playerValues[p.id];
					const winnerShare = remainingPool * (inversePoints / totalInversePoints);
					const reward = Math.floor(winnerShare);
					
					rewards[p.id] = bets[p.id] + reward;
					updatePlayerMoney(p.id, reward, blackjackData, p);
					updatePlayerStats(p.id, "win", blackjackData, p);
					remainingPool -= reward;
				});
			}
			
			// Xử lý người chơi hòa (lấy lại tiền cược)
			tiePlayers.forEach(p => {
				rewards[p.id] = bets[p.id];
				updatePlayerMoney(p.id, 0, blackjackData, p);
				updatePlayerStats(p.id, "tie", blackjackData, p);
			});
			
			// Xử lý người chơi thua (mất toàn bộ tiền cược)
			losePlayers.forEach(p => {
				rewards[p.id] = 0;
				updatePlayerMoney(p.id, -bets[p.id], blackjackData, p);
				updatePlayerStats(p.id, "lose", blackjackData, p);
			});
			
			// Tạo các trường kết quả để hiển thị
			const resultFields = results.map((r) => {
				const rewardText = rewards[r.user.id] > bets[r.user.id] ? 
					`+${rewards[r.user.id] - bets[r.user.id]}$` :
					rewards[r.user.id] === bets[r.user.id] ? 
					`±0$` : 
					`-${bets[r.user.id]}$`;
				
				const newBalance = getPlayerMoney(r.user.id, blackjackData);
				
				return {
					name: r.user.username,
					value:
						r.result === "blackjack" ? `Xì bàn! ${rewardText}\nSố dư: ${newBalance}$`
						: r.result === "win" ? `Thắng ${rewardText}\nSố dư: ${newBalance}$`
						: r.result === "tie" ? `Hòa ${rewardText}\nSố dư: ${newBalance}$`
						: `Thua ${rewardText}\nSố dư: ${newBalance}$`,
					inline: true,
				}
			});
			
			// Thêm tiền cho người chơi trong ZiRank (hệ thống cơ bản)
			await Promise.all(
				results.map(({ user, result }) => {
					const CoinADD =
						result === "blackjack" ? 50
						: result === "win" ? 30
						: result === "lose" ? -20
						: 0;
					return ZiRank.execute({ user, XpADD: 0, CoinADD });
				}),
			);
			
			await endGame(resultFields);
		};

		collector.on("collect", async (i) => {
			// Kiểm tra xem người tương tác có phải là người chơi hiện tại
			const player = players[currentPlayerIndex];
			if (i.user.id !== player.id) {
				return i.reply({ 
					content: `Hiện đang là lượt của ${player}. Vui lòng đợi đến lượt của bạn.`, 
					ephemeral: true 
				});
			}
			
			await i.deferUpdate();
			const hand = playerHands[player.id];
			
			if (i.customId === "hit") {
				// Rút thêm bài
				hand.push(deck.pop());
				const total = handValue(hand);
				
				// Cập nhật giá trị bài cho người chơi
				playerValues[player.id] = total;
				
				if (total > 21) {
					playerStates[player.id].bust = true;
					playerStates[player.id].stand = true;
					
					// Cập nhật giao diện để hiển thị người chơi bị quá bài
					embed = EmbedBuilder.from(embed).setDescription(renderDescription());
					await interaction.editReply({ embeds: [embed], components: [buttons] });
					
					// Đợi 1 giây để người chơi thấy kết quả rồi chuyển sang người chơi tiếp theo
					setTimeout(() => nextPlayer(), 1000);
				} else {
					embed = EmbedBuilder.from(embed).setDescription(renderDescription());
					await interaction.editReply({ embeds: [embed], components: [buttons] });
				}
			} else if (i.customId === "stand") {
				// Người chơi dừng
				playerStates[player.id].stand = true;
				
				// Cập nhật giao diện
				embed = EmbedBuilder.from(embed).setDescription(renderDescription());
				await interaction.editReply({ embeds: [embed], components: [buttons] });
				
				// Đợi 1 giây rồi chuyển sang người chơi tiếp theo
				setTimeout(() => nextPlayer(), 1000);
			}
		});

		collector.on("end", async (_, reason) => {
			if (reason === "time") {
				// Tự động stand cho người chơi hiện tại nếu hết thời gian
				if (currentPlayerIndex < players.length) {
					playerStates[players[currentPlayerIndex].id].stand = true;
					await nextPlayer();
				}
				
				buttons.components.forEach((btn) => btn.setDisabled(true));
				const finalEmbed = EmbedBuilder.from(embed).setFooter({ text: "Trò chơi đã hết thời gian!" });
				await interaction.editReply({ embeds: [finalEmbed], components: [buttons] });
			}
		});

		// Nếu tất cả người chơi đều đã stand hoặc bust, chuyển sang lượt của nhà cái
		if (currentPlayerIndex >= players.length) {
			await dealerTurn();
		}
	};
};
