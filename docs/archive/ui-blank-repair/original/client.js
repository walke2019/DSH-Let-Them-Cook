window.__ModuleLoader__.load({
	id: "@dsh-external/dsh-group-chat",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region \0rolldown/runtime.js
		var __create = Object.create;
		var __defProp = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __getProtoOf = Object.getPrototypeOf;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __copyProps = (to, from, except, desc) => {
			if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
				key = keys[i];
				if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
			return to;
		};
		var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
			value: mod,
			enumerable: true
		}) : target, mod));
		//#endregion
		let react = require("react");
		react = __toESM(react, 1);
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/GroupChatPanel.tsx
		function GroupChatPanel({ mode = "full", onClose }) {
			const [room, setRoom] = (0, react.useState)(null);
			const [messages, setMessages] = (0, react.useState)([]);
			const [ledger, setLedger] = (0, react.useState)(null);
			const [inputVal, setInputVal] = (0, react.useState)("");
			const [scratchpadDraft, setScratchpadDraft] = (0, react.useState)("");
			const [isSending, setIsSending] = (0, react.useState)(false);
			const [expandedSteps, setExpandedSteps] = (0, react.useState)({});
			const [showThinkingMap, setShowThinkingMap] = (0, react.useState)({});
			const [showToolsMap, setShowToolsMap] = (0, react.useState)({});
			const [activeTab, setActiveTab] = (0, react.useState)("steps");
			const [editingAgent, setEditingAgent] = (0, react.useState)(null);
			const [agentForm, setAgentForm] = (0, react.useState)({
				name: "",
				avatar: "",
				title: "",
				roleDescription: "",
				systemPrompt: "",
				provider: "deepseek",
				model: "deepseek-chat",
				canWriteScratchpad: false,
				canApproveWorkflow: false
			});
			const fileInputRef = (0, react.useRef)(null);
			const stepsEndRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				if (mode === "full") {
					document.body.setAttribute("data-dsh-group-chat-active", "true");
					const hideComposerNodes = () => {
						document.querySelectorAll("[data-composer-seat], [data-composer-card], [class*=\"composerSeat\"], [class*=\"composerStack\"], [class*=\"uV2eYG_root\"]").forEach((node) => {
							if (node instanceof HTMLElement) {
								node.dataset.originalDisplay = node.style.display || "";
								node.style.setProperty("display", "none", "important");
							}
						});
					};
					hideComposerNodes();
					const timer = setInterval(hideComposerNodes, 500);
					return () => {
						clearInterval(timer);
						document.body.removeAttribute("data-dsh-group-chat-active");
						document.querySelectorAll("[data-composer-seat], [data-composer-card], [class*=\"composerSeat\"], [class*=\"composerStack\"], [class*=\"uV2eYG_root\"]").forEach((node) => {
							if (node instanceof HTMLElement && node.dataset.originalDisplay !== void 0) node.style.display = node.dataset.originalDisplay;
						});
					};
				}
			}, [mode]);
			const fetchRoomData = async () => {
				try {
					const res = await fetch("/dsh-group-chat/api/room?id=dev-team-alpha");
					if (!res.ok) return;
					const data = await res.json();
					if (data.room) {
						setRoom(data.room);
						setScratchpadDraft(data.room.scratchpad || "");
					}
					if (data.messages) setMessages(data.messages);
					if (data.ledger) setLedger(data.ledger);
				} catch (err) {
					console.error("[GroupChat] fetch error:", err);
				}
			};
			(0, react.useEffect)(() => {
				fetchRoomData();
				let es = null;
				try {
					es = new EventSource("/dsh-group-chat/api/events");
					es.onmessage = (e) => {
						try {
							const data = JSON.parse(e.data);
							if (data.type === "message:new") {
								setMessages((prev) => {
									const next = [...prev, data.payload];
									setExpandedSteps((old) => ({
										...old,
										[data.payload.messageId]: true
									}));
									return next;
								});
								fetchRoomData();
							} else if (data.type === "scratchpad:updated") setScratchpadDraft(data.payload.scratchpad);
							else if (data.type === "room:updated") setRoom(data.payload);
							else if (data.type === "stage:advanced" || data.type === "stage:rejected") setRoom(data.payload);
						} catch {}
					};
				} catch {}
				return () => {
					if (es) es.close();
				};
			}, []);
			(0, react.useEffect)(() => {
				if (activeTab === "steps") stepsEndRef.current?.scrollIntoView({ behavior: "smooth" });
			}, [messages, activeTab]);
			const handleSendMessage = async () => {
				if (!inputVal.trim() || isSending) return;
				setIsSending(true);
				try {
					await fetch("/dsh-group-chat/api/message", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							roomId: room?.id || "dev-team-alpha",
							content: inputVal.trim()
						})
					});
					setInputVal("");
				} catch (err) {
					console.error("Send message failed:", err);
				} finally {
					setIsSending(false);
				}
			};
			const handleSwitchTheme = async (theme) => {
				try {
					const res = await fetch("/dsh-group-chat/api/theme", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							roomId: room?.id || "dev-team-alpha",
							theme
						})
					});
					if (res.ok) {
						const data = await res.json();
						if (data.room) setRoom(data.room);
					}
				} catch (err) {
					console.error("Theme switch failed:", err);
				}
			};
			const openEditAgentModal = (agent) => {
				setEditingAgent(agent);
				setAgentForm({
					name: agent.name,
					avatar: agent.avatar,
					title: agent.title || "",
					roleDescription: agent.roleDescription,
					systemPrompt: agent.systemPrompt || "",
					provider: agent.llmConfig?.provider || "deepseek",
					model: agent.llmConfig?.model || "deepseek-chat",
					canWriteScratchpad: agent.permissions?.canWriteScratchpad ?? false,
					canApproveWorkflow: agent.permissions?.canApproveWorkflow ?? false
				});
			};
			const handleAvatarFileUpload = (e) => {
				const file = e.target.files?.[0];
				if (!file) return;
				const reader = new FileReader();
				reader.onload = (uploadEvent) => {
					const result = uploadEvent.target?.result;
					if (typeof result === "string") setAgentForm((prev) => ({
						...prev,
						avatar: result
					}));
				};
				reader.readAsDataURL(file);
			};
			const handleSaveAgent = async () => {
				if (!editingAgent) return;
				try {
					if ((await fetch("/dsh-group-chat/api/agent/update", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							roomId: room?.id || "dev-team-alpha",
							agentId: editingAgent.id,
							name: agentForm.name,
							avatar: agentForm.avatar,
							title: agentForm.title,
							roleDescription: agentForm.roleDescription,
							systemPrompt: agentForm.systemPrompt,
							llmConfig: {
								provider: agentForm.provider,
								model: agentForm.model
							},
							permissions: {
								canWriteScratchpad: agentForm.canWriteScratchpad,
								canApproveWorkflow: agentForm.canApproveWorkflow
							}
						})
					})).ok) {
						setEditingAgent(null);
						fetchRoomData();
					}
				} catch (err) {
					console.error("Save agent failed:", err);
				}
			};
			const handleApproveStage = async () => {
				try {
					await fetch("/dsh-group-chat/api/workflow/advance", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							roomId: room?.id || "dev-team-alpha",
							approverRoleId: "commander",
							summary: "指挥官审查通过当前阶段交付成果，准予放行进入下一阶段"
						})
					});
					fetchRoomData();
				} catch (err) {
					console.error("Approve failed:", err);
				}
			};
			const handleRejectStage = async () => {
				const reason = prompt("请输入指挥官打回整改意见：", "交付物未满足验收标准，缺少边界异常处理");
				if (!reason) return;
				try {
					await fetch("/dsh-group-chat/api/workflow/reject", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							roomId: room?.id || "dev-team-alpha",
							reason
						})
					});
					fetchRoomData();
				} catch (err) {
					console.error("Reject failed:", err);
				}
			};
			const currentStage = room?.workflow?.stages[room.workflow.currentStageIndex];
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: {
					display: "flex",
					flexDirection: "column",
					height: "100%",
					width: "100%",
					backgroundColor: "var(--dsw-alias-bg-base, #0d0d11)",
					color: "var(--dsw-alias-label-primary, #f8fafc)",
					fontFamily: "var(--dsw-font-family, system-ui, -apple-system, sans-serif)",
					boxSizing: "border-box",
					position: "relative",
					overflow: "hidden"
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
						type: "file",
						ref: fileInputRef,
						onChange: handleAvatarFileUpload,
						accept: "image/*",
						style: { display: "none" }
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							padding: "10px 16px",
							borderBottom: "1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.08))",
							backgroundColor: "var(--dsw-alias-bg-layer-1, #151518)",
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							flexShrink: 0
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								display: "flex",
								alignItems: "center",
								gap: "10px"
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: { fontSize: "20px" },
								children: "🎖️"
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									alignItems: "center",
									gap: "8px"
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									style: {
										fontSize: "15px",
										fontWeight: 600
									},
									children: room?.name || "研发特遣阿尔法分队"
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									style: {
										fontSize: "10px",
										padding: "1px 6px",
										borderRadius: "10px",
										backgroundColor: "rgba(77, 107, 254, 0.15)",
										color: "var(--dsw-alias-state-business-primary, #4d6bfe)",
										border: "1px solid rgba(77, 107, 254, 0.3)"
									},
									children: ["模式: ", room?.dispatchMode]
								})]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: {
									fontSize: "11px",
									color: "var(--dsw-alias-label-tertiary, #94a3b8)",
									marginTop: "2px"
								},
								children: "总指挥审核把控 · 全盘分工 · 角色流程化驱动 · 状态机推演"
							})] })]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								display: "flex",
								alignItems: "center",
								gap: "12px"
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									alignItems: "center",
									gap: "4px",
									background: "var(--dsw-alias-bg-layer-2, #1b1b1f)",
									padding: "2px 4px",
									borderRadius: "6px"
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									style: {
										fontSize: "11px",
										color: "var(--dsw-alias-label-tertiary, #94a3b8)",
										paddingLeft: "4px"
									},
									children: "主题:"
								}), [
									{
										id: "modern",
										label: "现代精英"
									},
									{
										id: "three_kingdoms",
										label: "三国风云"
									},
									{
										id: "legends",
										label: "现代传奇"
									}
								].map((t) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									onClick: () => handleSwitchTheme(t.id),
									style: {
										padding: "3px 8px",
										fontSize: "11px",
										borderRadius: "4px",
										border: "none",
										cursor: "pointer",
										backgroundColor: room?.activeTheme === t.id ? "var(--dsw-alias-state-business-primary, #4d6bfe)" : "transparent",
										color: room?.activeTheme === t.id ? "#fff" : "var(--dsw-alias-label-secondary, #94a3b8)",
										fontWeight: room?.activeTheme === t.id ? 600 : 400
									},
									children: t.label
								}, t.id))]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: {
									display: "flex",
									gap: "4px",
									background: "var(--dsw-alias-bg-layer-2, #1b1b1f)",
									padding: "2px 4px",
									borderRadius: "6px"
								},
								children: [
									{
										id: "steps",
										label: "推演流 (State Machine)"
									},
									{
										id: "scratchpad",
										label: "共享黑板"
									},
									{
										id: "roster",
										label: "特遣花名册"
									}
								].map((tab) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									onClick: () => setActiveTab(tab.id),
									style: {
										padding: "4px 10px",
										fontSize: "11px",
										borderRadius: "4px",
										border: "none",
										cursor: "pointer",
										backgroundColor: activeTab === tab.id ? "var(--dsw-alias-bg-layer-3, #2a2a30)" : "transparent",
										color: activeTab === tab.id ? "var(--dsw-alias-label-primary, #fff)" : "var(--dsw-alias-label-tertiary, #94a3b8)",
										fontWeight: activeTab === tab.id ? 600 : 400
									},
									children: tab.label
								}, tab.id))
							})]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							padding: "8px 16px",
							backgroundColor: "var(--dsw-alias-bg-layer-2, #1b1b1f)",
							borderBottom: "1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.06))",
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							flexShrink: 0
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: {
								display: "flex",
								alignItems: "center",
								gap: "16px",
								flex: 1,
								overflowX: "auto"
							},
							children: room?.workflow?.stages.map((st, idx) => {
								const isCurrent = idx === room.workflow.currentStageIndex && !room.workflow.isCompleted;
								const isDone = idx < room.workflow.currentStageIndex || room.workflow.isCompleted;
								const isWaitingApproval = st.status === "awaiting_approval";
								return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: {
										display: "flex",
										alignItems: "center",
										gap: "6px",
										opacity: isCurrent || isDone ? 1 : .45,
										flexShrink: 0
									},
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											style: {
												width: "18px",
												height: "18px",
												borderRadius: "50%",
												display: "inline-flex",
												alignItems: "center",
												justifyContent: "center",
												fontSize: "10px",
												fontWeight: 700,
												backgroundColor: isDone ? "#10b981" : isCurrent ? "#4d6bfe" : "#475569",
												color: "#fff"
											},
											children: isDone ? "✓" : idx + 1
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											style: {
												fontSize: "12px",
												fontWeight: isCurrent ? 600 : 400,
												color: isWaitingApproval ? "#eab308" : isCurrent ? "#60a5fa" : "inherit"
											},
											children: st.name
										}),
										idx < (room?.workflow?.stages.length || 0) - 1 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											style: {
												color: "var(--dsw-alias-border-l2, rgba(255,255,255,0.2))",
												marginLeft: "6px"
											},
											children: "➔"
										})
									]
								}, st.id);
							})
						}), currentStage?.status === "awaiting_approval" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								display: "flex",
								alignItems: "center",
								gap: "8px",
								padding: "2px 10px",
								backgroundColor: "rgba(234, 179, 8, 0.12)",
								borderRadius: "6px",
								border: "1px solid rgba(234, 179, 8, 0.3)"
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									style: {
										fontSize: "11px",
										color: "#eab308"
									},
									children: "⚠️ 当前阶段产物等待指挥官审查："
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									onClick: handleApproveStage,
									style: {
										backgroundColor: "#10b981",
										color: "#fff",
										border: "none",
										borderRadius: "4px",
										padding: "3px 10px",
										fontSize: "11px",
										cursor: "pointer",
										fontWeight: 600
									},
									children: "✓ 审核放行"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									onClick: handleRejectStage,
									style: {
										backgroundColor: "#ef4444",
										color: "#fff",
										border: "none",
										borderRadius: "4px",
										padding: "3px 10px",
										fontSize: "11px",
										cursor: "pointer",
										fontWeight: 600
									},
									children: "✕ 打回整改"
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							flex: 1,
							overflowY: "auto",
							padding: "16px",
							position: "relative"
						},
						children: [
							activeTab === "steps" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									flexDirection: "column",
									gap: "10px",
									maxWidth: "1000px",
									margin: "0 auto"
								},
								children: [messages.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									style: {
										textAlign: "center",
										color: "var(--dsw-alias-label-tertiary, #94a3b8)",
										padding: "60px 0",
										fontSize: "13px"
									},
									children: "特遣队已集结就绪。请在下方指令台输入任务分工，或直接 @特定角色 发起协同推演！"
								}) : messages.map((msg) => {
									const isExpanded = expandedSteps[msg.messageId] ?? true;
									const hasThinking = Boolean(msg.reasoningContent);
									const isThinkingExpanded = showThinkingMap[msg.messageId] ?? false;
									const hasTools = Boolean(msg.metadata?.toolCalls && msg.metadata.toolCalls.length > 0);
									const isToolsExpanded = showToolsMap[msg.messageId] ?? true;
									const isUser = msg.sender.kind === "user";
									return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: {
											borderRadius: "8px",
											backgroundColor: isUser ? "var(--dsw-alias-bg-layer-2, #1b1b1f)" : "var(--dsw-alias-bg-layer-1, #151518)",
											border: "1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.08))",
											overflow: "hidden"
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											onClick: () => setExpandedSteps((prev) => ({
												...prev,
												[msg.messageId]: !isExpanded
											})),
											style: {
												display: "flex",
												alignItems: "center",
												justifyContent: "space-between",
												padding: "8px 12px",
												cursor: "pointer",
												backgroundColor: isUser ? "rgba(77, 107, 254, 0.05)" : "transparent",
												borderBottom: isExpanded ? "1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.06))" : "none",
												userSelect: "none"
											},
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												style: {
													display: "flex",
													alignItems: "center",
													gap: "8px"
												},
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														style: {
															width: "24px",
															height: "24px",
															borderRadius: "50%",
															display: "inline-flex",
															alignItems: "center",
															justifyContent: "center",
															backgroundColor: msg.sender.color || "var(--dsw-alias-state-business-primary, #4d6bfe)",
															overflow: "hidden",
															fontSize: "13px"
														},
														children: msg.sender.avatar.startsWith("data:") ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
															src: msg.sender.avatar,
															alt: "avatar",
															style: {
																width: "100%",
																height: "100%",
																objectFit: "cover"
															}
														}) : msg.sender.avatar
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														style: {
															fontWeight: 600,
															fontSize: "13px",
															color: "var(--dsw-alias-label-primary, #f8fafc)"
														},
														children: msg.sender.name
													}),
													msg.metadata?.stateMachine && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
														style: {
															fontSize: "10px",
															padding: "1px 6px",
															borderRadius: "4px",
															backgroundColor: "rgba(77, 107, 254, 0.12)",
															color: "#60a5fa",
															fontFamily: "monospace"
														},
														children: ["⚙️ ", msg.metadata.stateMachine]
													}),
													hasTools && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
														style: {
															fontSize: "10px",
															padding: "1px 6px",
															borderRadius: "4px",
															backgroundColor: "rgba(16, 185, 129, 0.15)",
															color: "#10b981",
															fontFamily: "monospace"
														},
														children: [
															"🛠️ ",
															msg.metadata.toolCalls?.length,
															" 个工具调用"
														]
													})
												]
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												style: {
													display: "flex",
													alignItems: "center",
													gap: "10px"
												},
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													style: {
														fontSize: "11px",
														color: "var(--dsw-alias-label-caption, #64748b)"
													},
													children: new Date(msg.timestamp).toLocaleTimeString()
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													style: {
														fontSize: "11px",
														color: "var(--dsw-alias-label-tertiary, #94a3b8)"
													},
													children: isExpanded ? "▲" : "▼"
												})]
											})]
										}), isExpanded && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											style: {
												padding: "12px 14px",
												display: "flex",
												flexDirection: "column",
												gap: "10px"
											},
											children: [
												hasThinking && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
													style: {
														borderRadius: "6px",
														backgroundColor: "rgba(255, 255, 255, 0.02)",
														border: "1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.06))",
														overflow: "hidden"
													},
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
														onClick: () => setShowThinkingMap((p) => ({
															...p,
															[msg.messageId]: !isThinkingExpanded
														})),
														style: {
															padding: "4px 8px",
															fontSize: "11px",
															color: "var(--dsw-alias-label-tertiary, #94a3b8)",
															display: "flex",
															alignItems: "center",
															justifyContent: "space-between",
															cursor: "pointer",
															background: "rgba(255,255,255,0.03)"
														},
														children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "🧠 思考过程与逻辑规划 (Thinking Chain)" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: isThinkingExpanded ? "收起" : "展开" })]
													}), isThinkingExpanded && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
														style: {
															padding: "8px 10px",
															fontSize: "12px",
															color: "var(--dsw-alias-label-secondary, #cbd5e1)",
															whiteSpace: "pre-wrap",
															fontFamily: "monospace",
															lineHeight: "1.5"
														},
														children: msg.reasoningContent
													})]
												}),
												hasTools && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
													style: {
														borderRadius: "6px",
														backgroundColor: "var(--dsw-alias-markdown-code-block, #121215)",
														border: "1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.1))",
														overflow: "hidden"
													},
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
														onClick: () => setShowToolsMap((p) => ({
															...p,
															[msg.messageId]: !isToolsExpanded
														})),
														style: {
															padding: "6px 10px",
															fontSize: "11px",
															fontWeight: 600,
															color: "#10b981",
															display: "flex",
															alignItems: "center",
															justifyContent: "space-between",
															cursor: "pointer",
															borderBottom: isToolsExpanded ? "1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.06))" : "none"
														},
														children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "🛠️ 工具调用与读写执行详情 (Tool Execution Inspector)" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: isToolsExpanded ? "▲" : "▼" })]
													}), isToolsExpanded && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
														style: {
															padding: "8px 10px",
															display: "flex",
															flexDirection: "column",
															gap: "8px"
														},
														children: msg.metadata.toolCalls?.map((tc, tcIdx) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
															style: {
																padding: "6px 8px",
																borderRadius: "4px",
																backgroundColor: "rgba(255, 255, 255, 0.03)",
																border: "1px solid rgba(255, 255, 255, 0.06)",
																fontSize: "11px"
															},
															children: [
																/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
																	style: {
																		display: "flex",
																		justifyContent: "space-between",
																		marginBottom: "4px"
																	},
																	children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
																		style: {
																			fontWeight: 600,
																			color: "#60a5fa",
																			fontFamily: "monospace"
																		},
																		children: ["$ ", tc.name]
																	}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
																		style: {
																			color: tc.status === "success" ? "#10b981" : "#f59e0b",
																			fontSize: "10px"
																		},
																		children: [tc.status === "success" ? "✓ 执行完成" : "执行中...", tc.durationMs ? ` (${tc.durationMs}ms)` : ""]
																	})]
																}),
																tc.readWritePath && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
																	style: {
																		color: "var(--dsw-alias-label-tertiary, #94a3b8)",
																		fontSize: "10px",
																		marginBottom: "4px"
																	},
																	children: ["📁 目标路径: ", /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: tc.readWritePath })]
																}),
																/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
																	style: {
																		color: "var(--dsw-alias-label-secondary, #cbd5e1)",
																		fontFamily: "monospace",
																		whiteSpace: "pre-wrap",
																		fontSize: "11px"
																	},
																	children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																		style: { color: "#64748b" },
																		children: "入参: "
																	}), tc.arguments]
																}),
																tc.result && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
																	style: {
																		marginTop: "4px",
																		padding: "4px 6px",
																		borderRadius: "4px",
																		backgroundColor: "rgba(0, 0, 0, 0.3)",
																		color: "#a7f3d0",
																		fontFamily: "monospace",
																		fontSize: "11px",
																		whiteSpace: "pre-wrap",
																		maxHeight: "120px",
																		overflowY: "auto"
																	},
																	children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																		style: { color: "#64748b" },
																		children: "返回: "
																	}), tc.result]
																})
															]
														}, tc.id || tcIdx))
													})]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													style: {
														fontSize: "13px",
														lineHeight: "1.6",
														color: "var(--dsw-alias-label-primary, #f8fafc)",
														whiteSpace: "pre-wrap"
													},
													children: msg.content
												})
											]
										})]
									}, msg.messageId);
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { ref: stepsEndRef })]
							}),
							activeTab === "scratchpad" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: {
									height: "100%",
									display: "flex",
									flexDirection: "column",
									gap: "10px",
									maxWidth: "1000px",
									margin: "0 auto"
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: {
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center"
									},
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										style: {
											fontWeight: 600,
											fontSize: "14px"
										},
										children: "团队共享黑板 (Shared Scratchpad)"
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										style: {
											fontSize: "11px",
											color: "var(--dsw-alias-label-tertiary, #94a3b8)",
											marginLeft: "10px"
										},
										children: "仅限总指挥官与文档写手具备写权限，沉淀全盘共识与架构定式"
									})] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										onClick: async () => {
											await fetch("/dsh-group-chat/api/scratchpad", {
												method: "POST",
												headers: { "Content-Type": "application/json" },
												body: JSON.stringify({
													roomId: room?.id || "dev-team-alpha",
													scratchpad: scratchpadDraft,
													operatorRoleId: "commander"
												})
											});
											alert("共享黑板保存成功！");
										},
										style: {
											backgroundColor: "var(--dsw-alias-state-business-primary, #4d6bfe)",
											color: "#fff",
											border: "none",
											borderRadius: "6px",
											padding: "6px 14px",
											fontSize: "12px",
											cursor: "pointer",
											fontWeight: 600
										},
										children: "保存备忘录"
									})]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
									value: scratchpadDraft,
									onChange: (e) => setScratchpadDraft(e.target.value),
									style: {
										flex: 1,
										minHeight: "400px",
										width: "100%",
										backgroundColor: "var(--dsw-alias-bg-layer-1, #151518)",
										border: "1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.1))",
										borderRadius: "8px",
										color: "var(--dsw-alias-label-primary, #f8fafc)",
										fontFamily: "monospace",
										fontSize: "12px",
										padding: "12px",
										resize: "none",
										boxSizing: "border-box"
									}
								})]
							}),
							activeTab === "roster" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									flexDirection: "column",
									gap: "14px",
									maxWidth: "1000px",
									margin: "0 auto"
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									style: {
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center"
									},
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										style: {
											fontWeight: 600,
											fontSize: "14px"
										},
										children: "特遣队成员花名册与权限矩阵"
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										style: {
											fontSize: "11px",
											color: "var(--dsw-alias-label-tertiary, #94a3b8)",
											marginTop: "2px"
										},
										children: "点击任意角色卡片中的【✏️ 编辑角色】或头像，可自定义名称、上传自定义头像图片、修改系统设定及模型配置"
									})] })
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									style: {
										display: "grid",
										gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
										gap: "12px"
									},
									children: room?.members.map((member) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: {
											backgroundColor: "var(--dsw-alias-bg-layer-1, #151518)",
											border: "1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.08))",
											borderRadius: "8px",
											padding: "12px",
											display: "flex",
											flexDirection: "column",
											justifyContent: "space-between"
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											style: {
												display: "flex",
												alignItems: "center",
												justifyContent: "space-between"
											},
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												style: {
													display: "flex",
													alignItems: "center",
													gap: "10px"
												},
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													onClick: () => openEditAgentModal(member),
													title: "点击更换头像图片",
													style: {
														width: "36px",
														height: "36px",
														borderRadius: "50%",
														backgroundColor: member.color || "#4d6bfe",
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														cursor: "pointer",
														overflow: "hidden",
														fontSize: "18px",
														boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
													},
													children: member.avatar.startsWith("data:") ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
														src: member.avatar,
														alt: member.name,
														style: {
															width: "100%",
															height: "100%",
															objectFit: "cover"
														}
													}) : member.avatar
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													style: {
														fontWeight: 600,
														fontSize: "13px"
													},
													children: member.name
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													style: {
														fontSize: "11px",
														color: "var(--dsw-alias-label-tertiary, #94a3b8)"
													},
													children: member.title || member.id
												})] })]
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												onClick: () => openEditAgentModal(member),
												style: {
													backgroundColor: "transparent",
													border: "1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.12))",
													borderRadius: "4px",
													color: "var(--dsw-alias-label-secondary, #cbd5e1)",
													padding: "3px 8px",
													fontSize: "11px",
													cursor: "pointer"
												},
												children: "✏️ 编辑角色"
											})]
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											style: {
												fontSize: "12px",
												color: "var(--dsw-alias-label-secondary, #cbd5e1)",
												marginTop: "8px",
												lineHeight: "1.4"
											},
											children: member.roleDescription
										})] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											style: {
												marginTop: "12px",
												paddingTop: "8px",
												borderTop: "1px solid rgba(255,255,255,0.06)",
												display: "flex",
												justifyContent: "space-between",
												fontSize: "11px",
												color: "var(--dsw-alias-label-caption, #64748b)"
											},
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: ["模型: ", member.llmConfig?.model || "deepseek-chat"] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: ["黑板权限: ", member.permissions?.canWriteScratchpad ? "✓ 允许" : "✕ 只读"] })]
										})]
									}, member.id))
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							padding: "12px 16px",
							backgroundColor: "var(--dsw-alias-bg-layer-1, #151518)",
							borderTop: "1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.08))",
							display: "flex",
							flexDirection: "column",
							gap: "8px",
							flexShrink: 0
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								display: "flex",
								alignItems: "center",
								gap: "6px",
								overflowX: "auto"
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									style: {
										fontSize: "11px",
										color: "var(--dsw-alias-label-tertiary, #94a3b8)"
									},
									children: "快速@:"
								}),
								room?.members.map((m) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									onClick: () => setInputVal((prev) => `${prev}@${m.name} `),
									style: {
										background: "var(--dsw-alias-bg-layer-2, #1b1b1f)",
										border: "1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.08))",
										borderRadius: "12px",
										padding: "2px 8px",
										fontSize: "11px",
										color: "var(--dsw-alias-label-secondary, #cbd5e1)",
										cursor: "pointer"
									},
									children: [
										m.avatar.startsWith("data:") ? "👤" : m.avatar,
										" ",
										m.name
									]
								}, m.id)),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									onClick: () => setInputVal((prev) => `${prev}@全员争鸣 `),
									style: {
										background: "rgba(77, 107, 254, 0.1)",
										border: "1px solid rgba(77, 107, 254, 0.25)",
										borderRadius: "12px",
										padding: "2px 8px",
										fontSize: "11px",
										color: "#60a5fa",
										cursor: "pointer",
										fontWeight: 600
									},
									children: "@全员争鸣"
								})
							]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								display: "flex",
								gap: "8px"
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "text",
								placeholder: "下达特遣指挥指令 (支持 @总指挥官、@搜索调研、@前端UI开发 或 @全员争鸣)...",
								value: inputVal,
								onChange: (e) => setInputVal(e.target.value),
								onKeyDown: (e) => e.key === "Enter" && handleSendMessage(),
								style: {
									flex: 1,
									padding: "10px 12px",
									borderRadius: "8px",
									border: "1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.12))",
									backgroundColor: "var(--dsw-alias-bg-base, #0d0d11)",
									color: "var(--dsw-alias-label-primary, #f8fafc)",
									fontSize: "13px",
									outline: "none"
								}
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								onClick: handleSendMessage,
								disabled: isSending || !inputVal.trim(),
								style: {
									padding: "0 20px",
									borderRadius: "8px",
									border: "none",
									backgroundColor: "var(--dsw-alias-state-business-primary, #4d6bfe)",
									color: "#fff",
									fontSize: "13px",
									fontWeight: 600,
									cursor: isSending || !inputVal.trim() ? "not-allowed" : "pointer"
								},
								children: isSending ? "派发中..." : "发送指令"
							})]
						})]
					}),
					editingAgent && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: {
							position: "fixed",
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							backgroundColor: "rgba(0, 0, 0, 0.65)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							zIndex: 9999
						},
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								width: "520px",
								backgroundColor: "var(--dsw-alias-bg-layer-1, #151518)",
								border: "1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.12))",
								borderRadius: "12px",
								padding: "20px",
								display: "flex",
								flexDirection: "column",
								gap: "12px",
								boxShadow: "var(--dsw-shadow-lv3, 0 12px 32px rgba(0,0,0,0.5))"
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: {
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center"
									},
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										style: {
											fontSize: "15px",
											fontWeight: 600
										},
										children: [
											"编辑特遣角色属性 (",
											editingAgent.id,
											")"
										]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										onClick: () => setEditingAgent(null),
										style: {
											background: "transparent",
											border: "none",
											color: "#94a3b8",
											fontSize: "16px",
											cursor: "pointer"
										},
										children: "✕"
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: {
										display: "flex",
										alignItems: "center",
										gap: "14px",
										padding: "10px 0"
									},
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										onClick: () => fileInputRef.current?.click(),
										title: "点击上传本地头像图片",
										style: {
											width: "54px",
											height: "54px",
											borderRadius: "50%",
											backgroundColor: editingAgent.color || "#4d6bfe",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											cursor: "pointer",
											overflow: "hidden",
											fontSize: "24px",
											border: "2px dashed rgba(255,255,255,0.3)"
										},
										children: agentForm.avatar.startsWith("data:") ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
											src: agentForm.avatar,
											alt: "avatar",
											style: {
												width: "100%",
												height: "100%",
												objectFit: "cover"
											}
										}) : agentForm.avatar
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => fileInputRef.current?.click(),
										style: {
											backgroundColor: "var(--dsw-alias-bg-layer-2, #1b1b1f)",
											border: "1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.12))",
											color: "var(--dsw-alias-label-primary, #fff)",
											borderRadius: "6px",
											padding: "4px 10px",
											fontSize: "11px",
											cursor: "pointer"
										},
										children: "📁 上传本地头像图片"
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										style: {
											fontSize: "10px",
											color: "var(--dsw-alias-label-tertiary, #94a3b8)",
											marginTop: "4px"
										},
										children: "支持 PNG、JPG、WebP 格式，将自动保存为角色自定义头像"
									})] })]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: {
										display: "grid",
										gridTemplateColumns: "1fr 1fr",
										gap: "10px"
									},
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										style: {
											fontSize: "11px",
											color: "var(--dsw-alias-label-secondary, #cbd5e1)"
										},
										children: "角色显示姓名"
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "text",
										value: agentForm.name,
										onChange: (e) => setAgentForm({
											...agentForm,
											name: e.target.value
										}),
										style: {
											width: "100%",
											padding: "6px 8px",
											borderRadius: "6px",
											background: "var(--dsw-alias-bg-base, #0d0d11)",
											border: "1px solid rgba(255,255,255,0.1)",
											color: "#fff",
											fontSize: "12px",
											marginTop: "4px",
											boxSizing: "border-box"
										}
									})] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										style: {
											fontSize: "11px",
											color: "var(--dsw-alias-label-secondary, #cbd5e1)"
										},
										children: "角色头衔/职称"
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "text",
										value: agentForm.title,
										onChange: (e) => setAgentForm({
											...agentForm,
											title: e.target.value
										}),
										style: {
											width: "100%",
											padding: "6px 8px",
											borderRadius: "6px",
											background: "var(--dsw-alias-bg-base, #0d0d11)",
											border: "1px solid rgba(255,255,255,0.1)",
											color: "#fff",
											fontSize: "12px",
											marginTop: "4px",
											boxSizing: "border-box"
										}
									})] })]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									style: {
										fontSize: "11px",
										color: "var(--dsw-alias-label-secondary, #cbd5e1)"
									},
									children: "专长职责描述"
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
									value: agentForm.roleDescription,
									onChange: (e) => setAgentForm({
										...agentForm,
										roleDescription: e.target.value
									}),
									style: {
										width: "100%",
										height: "50px",
										padding: "6px 8px",
										borderRadius: "6px",
										background: "var(--dsw-alias-bg-base, #0d0d11)",
										border: "1px solid rgba(255,255,255,0.1)",
										color: "#fff",
										fontSize: "11px",
										marginTop: "4px",
										resize: "none",
										boxSizing: "border-box"
									}
								})] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
									style: {
										fontSize: "11px",
										color: "var(--dsw-alias-label-secondary, #cbd5e1)"
									},
									children: "角色系统设定提示词 (System Prompt)"
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
									value: agentForm.systemPrompt,
									onChange: (e) => setAgentForm({
										...agentForm,
										systemPrompt: e.target.value
									}),
									style: {
										width: "100%",
										height: "80px",
										padding: "6px 8px",
										borderRadius: "6px",
										background: "var(--dsw-alias-bg-base, #0d0d11)",
										border: "1px solid rgba(255,255,255,0.1)",
										color: "#fff",
										fontSize: "11px",
										marginTop: "4px",
										resize: "none",
										boxSizing: "border-box"
									}
								})] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: {
										display: "flex",
										gap: "20px",
										padding: "6px 0"
									},
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										style: {
											display: "flex",
											alignItems: "center",
											gap: "6px",
											fontSize: "11px",
											cursor: "pointer"
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: agentForm.canWriteScratchpad,
											onChange: (e) => setAgentForm({
												...agentForm,
												canWriteScratchpad: e.target.checked
											})
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "允许编辑共享黑板 (Write Scratchpad)" })]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										style: {
											display: "flex",
											alignItems: "center",
											gap: "6px",
											fontSize: "11px",
											cursor: "pointer"
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: agentForm.canApproveWorkflow,
											onChange: (e) => setAgentForm({
												...agentForm,
												canApproveWorkflow: e.target.checked
											})
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "具备工作流审核审批特权 (Approve Workflow)" })]
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: {
										display: "flex",
										justifyContent: "flex-end",
										gap: "8px",
										marginTop: "6px"
									},
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setEditingAgent(null),
										style: {
											backgroundColor: "transparent",
											border: "1px solid rgba(255,255,255,0.15)",
											color: "#fff",
											borderRadius: "6px",
											padding: "6px 14px",
											fontSize: "12px",
											cursor: "pointer"
										},
										children: "取消"
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: handleSaveAgent,
										style: {
											backgroundColor: "var(--dsw-alias-state-business-primary, #4d6bfe)",
											color: "#fff",
											border: "none",
											borderRadius: "6px",
											padding: "6px 16px",
											fontSize: "12px",
											cursor: "pointer",
											fontWeight: 600
										},
										children: "保存修改"
									})]
								})
							]
						})
					})
				]
			});
		}
		//#endregion
		//#region src/client/layout-push.ts
		/**
		* DSH Group Chat - Layout Push 样式引擎
		* 参考 dsh-better-sidebar 工业级实现：
		* 通过 padding-right 真实推挤 DSH 的 AppFrame 栅格系统，
		* 使得主对话区、原生 Composer 打字输入框、右侧详情栏与滚动条自适应向左收缩，
		* 彻底杜绝遮挡、覆盖或丢失原生页面元素！
		*/
		const LAYOUT_PUSH_CSS = `
/* 1. 给 DSH AppFrame 注入 padding-right，物理推挤主视窗，保持原生输入框和聊天流完好 */
#root [data-dsh-frame],
#root > [data-slot="root"] > div {
  box-sizing: border-box !important;
  padding-right: var(--dsh-group-chat-width, 0px) !important;
  transition: padding-right var(--ds-transition-duration-slow, 0.25s) var(--ds-ease-in-out, cubic-bezier(0.4, 0, 0.2, 1)) !important;
}

/* 2. details 栏（若有开启）自适应向左平移 */
#root [data-dsh-frame] > [data-side="details"],
#root > [data-slot="root"] > div > [data-side="details"] {
  transform: translateX(calc(0px - var(--dsh-group-chat-width, 0px))) !important;
  transition: transform var(--ds-transition-duration-slow, 0.25s) var(--ds-ease-in-out, cubic-bezier(0.4, 0, 0.2, 1)) !important;
}

/* 3. 当用户进入全屏“特遣协同”视图时，彻底隐藏官方默认的打字框及其包含的所有插件Notice（例如 Mnemon Notice 等），让工作台充满全屏 */
body[data-dsh-group-chat-active="true"] [data-composer-seat],
body[data-dsh-group-chat-active="true"] [data-composer-card],
body[data-dsh-group-chat-active="true"] [class*="composerSeat"],
body[data-dsh-group-chat-active="true"] [class*="composerCard"],
body[data-dsh-group-chat-active="true"] [data-slot*="conversation.composer"],
body[data-dsh-group-chat-active="true"] [class*="composerStack"],
body[data-dsh-group-chat-active="true"] [class*="uV2eYG_root"],
body[data-dsh-group-chat-active="true"] [class*="FJxK0a_root"],
body[data-dsh-group-chat-active="true"] [class*="uV2eYG_notice"],
body[data-dsh-group-chat-active="true"] div:has(> [data-composer-seat]),
body[data-dsh-group-chat-active="true"] div:has(> [data-composer-card]) {
  display: none !important;
  visibility: hidden !important;
  height: 0 !important;
  min-height: 0 !important;
  max-height: 0 !important;
  opacity: 0 !important;
  pointer-events: none !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
}

body[data-dsh-group-chat-active="true"] [data-conversation-scroll] {
  height: 100% !important;
  max-height: 100% !important;
  overflow: hidden !important;
  padding-bottom: 0 !important;
}

body[data-dsh-group-chat-active="true"] [data-conversation-scroll] > div:first-child,
body[data-dsh-group-chat-active="true"] [class*="viewArea"] {
  height: 100% !important;
  max-height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
  flex: 1 1 auto !important;
  overflow: hidden !important;
}

/* 4. 协同侧栏宿主容器 */
.dsh-gc-sidebar-host {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: var(--dsh-group-chat-width, 380px);
  height: 100vh;
  z-index: 50;
  background-color: var(--dsw-alias-bg-layer-1, #151518);
  border-left: 1px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.1));
  box-shadow: var(--dsw-shadow-lv2, -2px 0 12px rgba(0, 0, 0, 0.25));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
  transition: transform var(--ds-transition-duration-slow, 0.25s) var(--ds-ease-in-out, cubic-bezier(0.4, 0, 0.2, 1));
}

.dsh-gc-sidebar-host[data-collapsed="true"] {
  transform: translateX(100%);
  pointer-events: none;
}
`;
		function injectLayoutPushStyles() {
			const tagId = "dsh-group-chat/layout-push.css";
			if (typeof document !== "undefined" && document.querySelector(`style[data-plugin-css="${tagId}"]`) === null) {
				const style = document.createElement("style");
				style.dataset.plugin = "@dsh-external/dsh-group-chat";
				style.dataset.pluginCss = tagId;
				style.textContent = LAYOUT_PUSH_CSS;
				document.head.appendChild(style);
			}
		}
		function updateLayoutPushWidth(widthPx) {
			if (typeof document !== "undefined") document.documentElement.style.setProperty("--dsh-group-chat-width", `${widthPx}px`);
		}
		//#endregion
		//#region src/client/GroupChatSideDock.tsx
		const SIDEBAR_DEFAULT_WIDTH = 380;
		/**
		* 侧边栏辅助副屏 (Companion HUD)
		* 定位：区别于全屏主推演区，侧栏仅提供轻量、高密度的【拓扑监控 + 共享黑板 + 成员账本 + 快速指令】，绝不产生功能重叠！
		*/
		function GroupChatSideDock() {
			const [isOpen, setIsOpen] = (0, react.useState)(false);
			const [room, setRoom] = (0, react.useState)(null);
			const [ledger, setLedger] = (0, react.useState)(null);
			const [scratchpadDraft, setScratchpadDraft] = (0, react.useState)("");
			const [isEditingScratchpad, setIsEditingScratchpad] = (0, react.useState)(false);
			const [quickCmd, setQuickCmd] = (0, react.useState)("");
			const [isSending, setIsSending] = (0, react.useState)(false);
			const [activeTab, setActiveTab] = (0, react.useState)("workflow");
			const fetchRoomData = async () => {
				try {
					const res = await fetch("/dsh-group-chat/api/room?id=dev-team-alpha");
					if (!res.ok) return;
					const data = await res.json();
					if (data.room) {
						setRoom(data.room);
						setScratchpadDraft(data.room.scratchpad || "");
					}
					if (data.ledger) setLedger(data.ledger);
				} catch (err) {
					console.error("[GroupChatDock] fetch error:", err);
				}
			};
			(0, react.useEffect)(() => {
				injectLayoutPushStyles();
				fetchRoomData();
				let es = null;
				try {
					es = new EventSource("/dsh-group-chat/api/events");
					es.onmessage = (e) => {
						try {
							const data = JSON.parse(e.data);
							if (data.type === "room:updated" || data.type === "stage:advanced" || data.type === "stage:rejected") setRoom(data.payload);
							else if (data.type === "scratchpad:updated") setScratchpadDraft(data.payload.scratchpad);
							else if (data.type === "message:new") fetchRoomData();
						} catch {}
					};
				} catch {}
				return () => {
					if (es) es.close();
				};
			}, []);
			(0, react.useEffect)(() => {
				if (isOpen) updateLayoutPushWidth(SIDEBAR_DEFAULT_WIDTH);
				else updateLayoutPushWidth(0);
			}, [isOpen]);
			(0, react.useEffect)(() => {
				const handleKey = (e) => {
					if (e.key === "Escape" && isOpen) setIsOpen(false);
				};
				window.addEventListener("keydown", handleKey);
				return () => window.removeEventListener("keydown", handleKey);
			}, [isOpen]);
			const handleQuickSend = async () => {
				if (!quickCmd.trim() || isSending) return;
				setIsSending(true);
				try {
					await fetch("/dsh-group-chat/api/message", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							roomId: room?.id || "dev-team-alpha",
							content: quickCmd.trim()
						})
					});
					setQuickCmd("");
				} catch (err) {
					console.error("Send error:", err);
				} finally {
					setIsSending(false);
				}
			};
			const handleSaveScratchpad = async () => {
				try {
					await fetch("/dsh-group-chat/api/scratchpad", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							roomId: room?.id || "dev-team-alpha",
							scratchpad: scratchpadDraft,
							operatorRoleId: "commander"
						})
					});
					setIsEditingScratchpad(false);
				} catch (err) {
					console.error("Save scratchpad error:", err);
				}
			};
			const handleApproveStage = async () => {
				try {
					await fetch("/dsh-group-chat/api/workflow/advance", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							roomId: room?.id || "dev-team-alpha",
							approverRoleId: "commander",
							summary: "指挥官审核通过，批准进入下一阶段"
						})
					});
					fetchRoomData();
				} catch (err) {
					console.error("Approve error:", err);
				}
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [!isOpen && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				onClick: () => setIsOpen(true),
				title: "展开特遣协同副屏 (实时监控 HUD)",
				style: {
					position: "fixed",
					top: "72px",
					right: "0px",
					zIndex: 49,
					pointerEvents: "auto",
					display: "flex",
					alignItems: "center",
					gap: "6px",
					padding: "5px 10px",
					backgroundColor: "var(--dsw-alias-bg-layer-2, #1b1b1f)",
					border: "1px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.12))",
					borderRight: "none",
					borderTopLeftRadius: "16px",
					borderBottomLeftRadius: "16px",
					boxShadow: "var(--dsw-shadow-lv2, 0 4px 12px rgba(0,0,0,0.3))",
					cursor: "pointer",
					userSelect: "none",
					color: "var(--dsw-alias-label-primary, #f8fafc)",
					fontSize: "11px",
					fontWeight: 500,
					transition: "transform 0.15s ease"
				},
				onMouseEnter: (e) => e.currentTarget.style.transform = "translateX(-2px)",
				onMouseLeave: (e) => e.currentTarget.style.transform = "translateX(0)",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: { fontSize: "13px" },
						children: "🧭"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "特遣副屏" }),
					room?.workflow && !room.workflow.isCompleted && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { style: {
						width: "6px",
						height: "6px",
						borderRadius: "50%",
						backgroundColor: "var(--dsw-alias-state-business-primary, #4d6bfe)"
					} })
				]
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsh-gc-sidebar-host",
				"data-collapsed": !isOpen,
				style: {
					pointerEvents: isOpen ? "auto" : "none",
					display: "flex",
					flexDirection: "column",
					backgroundColor: "var(--dsw-alias-bg-layer-1, #151518)"
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							padding: "12px 14px",
							borderBottom: "1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.08))",
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between"
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								display: "flex",
								alignItems: "center",
								gap: "8px"
							},
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: { fontSize: "16px" },
								children: "🧭"
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: {
									fontSize: "13px",
									fontWeight: 600,
									color: "var(--dsw-alias-label-primary, #f8fafc)"
								},
								children: "特遣监控室 (HUD)"
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								style: {
									fontSize: "10px",
									color: "var(--dsw-alias-label-tertiary, #94a3b8)"
								},
								children: room?.name || "研发特遣阿尔法分队"
							})] })]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							onClick: () => setIsOpen(false),
							style: {
								background: "transparent",
								border: "none",
								color: "var(--dsw-alias-label-secondary, #94a3b8)",
								cursor: "pointer",
								fontSize: "14px",
								padding: "4px",
								borderRadius: "4px"
							},
							children: "✕"
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						style: {
							display: "flex",
							padding: "6px 12px",
							gap: "6px",
							background: "var(--dsw-alias-bg-layer-2, #1b1b1f)",
							borderBottom: "1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.06))"
						},
						children: [
							{
								id: "workflow",
								label: "工作流拓扑"
							},
							{
								id: "scratchpad",
								label: "共享黑板"
							},
							{
								id: "roster",
								label: "特遣账本"
							}
						].map((tab) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							onClick: () => setActiveTab(tab.id),
							style: {
								flex: 1,
								padding: "4px 6px",
								fontSize: "11px",
								borderRadius: "6px",
								border: "none",
								cursor: "pointer",
								background: activeTab === tab.id ? "var(--dsw-alias-bg-layer-3, #2a2a30)" : "transparent",
								color: activeTab === tab.id ? "var(--dsw-alias-label-primary, #fff)" : "var(--dsw-alias-label-tertiary, #94a3b8)",
								fontWeight: activeTab === tab.id ? 600 : 400
							},
							children: tab.label
						}, tab.id))
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							flex: 1,
							overflowY: "auto",
							padding: "12px",
							fontSize: "12px"
						},
						children: [
							activeTab === "workflow" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									flexDirection: "column",
									gap: "10px"
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: {
										fontSize: "11px",
										fontWeight: 600,
										color: "var(--dsw-alias-label-secondary, #94a3b8)",
										marginBottom: "4px",
										display: "flex",
										justifyContent: "space-between"
									},
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
										"阶段流程（共 ",
										room?.workflow?.stages?.length || 0,
										" 步）"
									] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										style: { color: "var(--dsw-alias-state-business-primary, #4d6bfe)" },
										children: room?.workflow?.isCompleted ? "已全部验收完成 ✓" : `进行中: 第 ${(room?.workflow?.currentStageIndex || 0) + 1} 步`
									})]
								}), room?.workflow?.stages.map((st, idx) => {
									const isCurrent = idx === room.workflow.currentStageIndex && !room.workflow.isCompleted;
									const isPast = idx < room.workflow.currentStageIndex || room.workflow.isCompleted;
									const isWaitingApproval = st.status === "awaiting_approval";
									return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: {
											padding: "8px 10px",
											borderRadius: "8px",
											background: isCurrent ? "rgba(77, 107, 254, 0.08)" : "var(--dsw-alias-bg-layer-2, #1b1b1f)",
											border: isCurrent ? "1px solid var(--dsw-alias-state-business-primary, #4d6bfe)" : "1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.06))"
										},
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												style: {
													display: "flex",
													alignItems: "center",
													justifyContent: "space-between"
												},
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
													style: {
														display: "flex",
														alignItems: "center",
														gap: "6px"
													},
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														style: {
															width: "18px",
															height: "18px",
															borderRadius: "50%",
															display: "inline-flex",
															alignItems: "center",
															justifyContent: "center",
															fontSize: "10px",
															fontWeight: 700,
															backgroundColor: isPast ? "#10b981" : isCurrent ? "#4d6bfe" : "#475569",
															color: "#fff"
														},
														children: isPast ? "✓" : idx + 1
													}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														style: {
															fontWeight: 600,
															color: "var(--dsw-alias-label-primary, #f8fafc)"
														},
														children: st.name
													})]
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													style: {
														fontSize: "10px",
														padding: "1px 6px",
														borderRadius: "10px",
														backgroundColor: isWaitingApproval ? "rgba(234, 179, 8, 0.15)" : isCurrent ? "rgba(77, 107, 254, 0.15)" : "transparent",
														color: isWaitingApproval ? "#eab308" : isCurrent ? "#60a5fa" : "var(--dsw-alias-label-caption, #64748b)"
													},
													children: st.status
												})]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
												style: {
													fontSize: "11px",
													color: "var(--dsw-alias-label-tertiary, #94a3b8)",
													marginTop: "4px"
												},
												children: st.description
											}),
											isWaitingApproval && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												style: {
													marginTop: "8px",
													padding: "6px 8px",
													borderRadius: "6px",
													background: "rgba(234, 179, 8, 0.1)",
													border: "1px dashed rgba(234, 179, 8, 0.3)",
													display: "flex",
													alignItems: "center",
													justifyContent: "space-between"
												},
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													style: {
														color: "#eab308",
														fontSize: "11px"
													},
													children: "⚠️ 产物就绪，等待指挥官放行"
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													onClick: handleApproveStage,
													style: {
														backgroundColor: "#10b981",
														color: "#fff",
														border: "none",
														borderRadius: "4px",
														padding: "2px 8px",
														fontSize: "10px",
														cursor: "pointer",
														fontWeight: 600
													},
													children: "批准放行"
												})]
											})
										]
									}, st.id);
								})]
							}),
							activeTab === "scratchpad" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									flexDirection: "column",
									height: "100%",
									gap: "8px"
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: {
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center"
									},
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										style: {
											color: "var(--dsw-alias-label-secondary, #94a3b8)",
											fontSize: "11px"
										},
										children: "团队共识备忘录 (Markdown)"
									}), !isEditingScratchpad ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										onClick: () => setIsEditingScratchpad(true),
										style: {
											background: "transparent",
											border: "1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.1))",
											color: "var(--dsw-alias-label-primary, #fff)",
											fontSize: "10px",
											borderRadius: "4px",
											padding: "2px 6px",
											cursor: "pointer"
										},
										children: "✏️ 编辑"
									}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										onClick: handleSaveScratchpad,
										style: {
											backgroundColor: "var(--dsw-alias-state-business-primary, #4d6bfe)",
											color: "#fff",
											border: "none",
											fontSize: "10px",
											borderRadius: "4px",
											padding: "2px 8px",
											cursor: "pointer",
											fontWeight: 600
										},
										children: "保存"
									})]
								}), isEditingScratchpad ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
									value: scratchpadDraft,
									onChange: (e) => setScratchpadDraft(e.target.value),
									style: {
										flex: 1,
										minHeight: "260px",
										width: "100%",
										background: "var(--dsw-alias-bg-layer-2, #1b1b1f)",
										border: "1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.1))",
										borderRadius: "8px",
										color: "var(--dsw-alias-label-primary, #f8fafc)",
										fontFamily: "monospace",
										fontSize: "11px",
										padding: "8px",
										resize: "none"
									}
								}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									style: {
										flex: 1,
										minHeight: "260px",
										background: "var(--dsw-alias-bg-layer-2, #1b1b1f)",
										border: "1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.06))",
										borderRadius: "8px",
										padding: "10px",
										color: "var(--dsw-alias-label-primary, #f8fafc)",
										whiteSpace: "pre-wrap",
										overflowY: "auto",
										lineHeight: "1.5"
									},
									children: scratchpadDraft || "（暂无黑板内容，指挥官与文案写手可随时写入技术决策）"
								})]
							}),
							activeTab === "roster" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: {
									display: "flex",
									flexDirection: "column",
									gap: "8px"
								},
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: {
											background: "var(--dsw-alias-bg-layer-2, #1b1b1f)",
											padding: "8px 10px",
											borderRadius: "8px",
											border: "1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.06))",
											display: "flex",
											justifyContent: "space-between"
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											style: {
												fontSize: "10px",
												color: "var(--dsw-alias-label-caption, #64748b)"
											},
											children: "总交互调用"
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											style: {
												fontSize: "14px",
												fontWeight: 700,
												color: "var(--dsw-alias-label-primary, #fff)"
											},
											children: [ledger?.totalCalls || 0, " 次"]
										})] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											style: {
												fontSize: "10px",
												color: "var(--dsw-alias-label-caption, #64748b)"
											},
											children: "总消耗 Token"
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											style: {
												fontSize: "14px",
												fontWeight: 700,
												color: "#10b981"
											},
											children: ledger?.totalTokens || 0
										})] })]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										style: {
											fontSize: "11px",
											color: "var(--dsw-alias-label-secondary, #94a3b8)",
											marginTop: "4px"
										},
										children: [
											"成员列表（",
											room?.members.length || 0,
											" 人）"
										]
									}),
									room?.members.map((member) => {
										const stat = ledger?.agentStats[member.id];
										return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											style: {
												display: "flex",
												alignItems: "center",
												justifyContent: "space-between",
												padding: "6px 8px",
												borderRadius: "6px",
												background: "var(--dsw-alias-bg-layer-2, #1b1b1f)"
											},
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												style: {
													display: "flex",
													alignItems: "center",
													gap: "8px"
												},
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													style: { fontSize: "14px" },
													children: member.avatar
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													style: {
														fontWeight: 600,
														color: "var(--dsw-alias-label-primary, #f8fafc)",
														fontSize: "11px"
													},
													children: member.name
												}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													style: {
														fontSize: "10px",
														color: "var(--dsw-alias-label-caption, #64748b)"
													},
													children: member.title || member.id
												})] })]
											}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
												style: {
													textAlign: "right",
													fontSize: "10px",
													color: "var(--dsw-alias-label-tertiary, #94a3b8)"
												},
												children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [stat?.callCount || 0, " 轮"] }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [stat?.totalTokens || 0, " T"] })]
											})]
										}, member.id);
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							padding: "10px",
							borderTop: "1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.08))",
							background: "var(--dsw-alias-bg-layer-2, #1b1b1f)",
							display: "flex",
							gap: "6px"
						},
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
							type: "text",
							placeholder: "下达快捷指令 (如 @孔明 查下竞品)...",
							value: quickCmd,
							onChange: (e) => setQuickCmd(e.target.value),
							onKeyDown: (e) => e.key === "Enter" && handleQuickSend(),
							style: {
								flex: 1,
								padding: "6px 8px",
								borderRadius: "6px",
								border: "1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.12))",
								background: "var(--dsw-alias-bg-layer-1, #151518)",
								color: "var(--dsw-alias-label-primary, #f8fafc)",
								fontSize: "11px",
								outline: "none"
							}
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							onClick: handleQuickSend,
							disabled: isSending || !quickCmd.trim(),
							style: {
								padding: "6px 10px",
								borderRadius: "6px",
								border: "none",
								background: "var(--dsw-alias-state-business-primary, #4d6bfe)",
								color: "#fff",
								fontSize: "11px",
								cursor: isSending || !quickCmd.trim() ? "not-allowed" : "pointer",
								fontWeight: 600
							},
							children: "派发"
						})]
					})
				]
			})] });
		}
		//#endregion
		//#region src/client/index.ts
		/**
		* @dsh-external/dsh-group-chat — Client 前端入口
		*
		* 挂载模式：
		* 1. conversation.view: 主视区全屏工作台 Tab（多 Agent 沉浸式状态机推演主战场 + 角色编辑与头像上传）
		* 2. shell.overlay: 右侧伴随监控副屏（Companion HUD：工作流拓扑 + 共享黑板 + 成员账本，不重叠主对话区）
		* 3. conversation.composer: 不注册官方 chain slot；由 layout-push.ts 的 CSS 在特遣协同激活时隐藏原生输入框
		*/
		const inject = ["slots"];
		function apply(ctx) {
			injectLayoutPushStyles();
			ctx.effect(() => {
				return ctx.slots.inject("conversation.view", () => {
					return ctx.slots.register({
						name: "conversation.view",
						id: "dsh-group-chat",
						order: 20,
						label: () => "特遣协同",
						component: () => (0, react.createElement)(GroupChatPanel, { mode: "full" })
					}, GroupChatPanel);
				});
			}, "dsh-group-chat: conversation.view panel");
			ctx.effect(() => {
				return ctx.slots.inject("shell.overlay", () => {
					return ctx.slots.register({
						name: "shell.overlay",
						id: "dsh-group-chat-dock",
						order: 50
					}, GroupChatSideDock);
				});
			}, "dsh-group-chat: layout-push side dock");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map