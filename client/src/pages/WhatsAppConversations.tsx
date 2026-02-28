import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Streamdown } from "streamdown";

export default function WhatsAppConversations() {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: conversations, isLoading } = trpc.whatsappReplies.list.useQuery({
    limit: 50,
    offset: 0,
  });

  const { data: selectedConv } = trpc.whatsappReplies.getById.useQuery(selectedConversation || 0, {
    enabled: selectedConversation !== null,
  });

  const generateReplyMutation = trpc.whatsappReplies.generateReply.useMutation();
  const flagForReviewMutation = trpc.whatsappReplies.flagForReview.useMutation();

  const handleGenerateReply = async (conversationId: number) => {
    await generateReplyMutation.mutateAsync({ conversationId });
  };

  const handleFlagForReview = async (conversationId: number) => {
    await flagForReviewMutation.mutateAsync(conversationId);
  };

  const filteredConversations = conversations?.conversations.filter(
    (conv) =>
      conv.customerPhone.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp Conversations</h1>
          <p className="text-muted-foreground">Manage incoming WhatsApp messages and AI-generated replies</p>
        </div>

        <Tabs defaultValue="conversations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="conversations">All Conversations</TabsTrigger>
            <TabsTrigger value="flagged">Flagged for Review</TabsTrigger>
          </TabsList>

          <TabsContent value="conversations" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Conversation List */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Conversations</CardTitle>
                  <CardDescription>{filteredConversations.length} total</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Search by phone or message..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />

                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No conversations yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredConversations.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => setSelectedConversation(conv.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            selectedConversation === conv.id
                              ? "bg-primary text-primary-foreground border-primary"
                              : "hover:bg-secondary border-border"
                          }`}
                        >
                          <div className="font-medium text-sm truncate">{conv.customerPhone}</div>
                          <div className="text-xs text-muted-foreground truncate">Last: {new Date(conv.lastMessageAt).toLocaleTimeString()}</div>
                          <div className="flex gap-2 mt-2">
                            {conv.flaggedForReview && (
                              <Badge variant="outline" className="text-xs">
                                Review
                              </Badge>
                            )}
                            {conv.autoReplyGenerated && (
                              <Badge variant="secondary" className="text-xs">
                                Replied
                              </Badge>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Conversation Details */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Conversation Details</CardTitle>
                  <CardDescription>
                    {selectedConv ? `From: ${selectedConv.customerPhone}` : "Select a conversation"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {selectedConv ? (
                    <>
                      {/* Message Thread */}
                      <div>
                        <label className="text-sm font-medium mb-3 block">Message Thread</label>
                        <div className="space-y-3 max-h-64 overflow-y-auto bg-secondary/30 p-4 rounded-lg">
                          {selectedConv.messageHistory && selectedConv.messageHistory.length > 0 ? (
                            selectedConv.messageHistory.map((msg: any, idx: number) => (
                              <div key={idx} className="space-y-1">
                                <div className="text-xs font-medium text-muted-foreground">
                                  {msg.role === "user" ? "Customer" : "AutoPilot"}
                                </div>
                                <div className={`text-sm p-2 rounded ${
                                  msg.role === "user"
                                    ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                                    : "bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100"
                                }`}>
                                  <Streamdown>{msg.content}</Streamdown>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">No messages yet</p>
                          )}
                        </div>
                      </div>

                      {/* AI Reply */}
                      {selectedConv.autoReplyGenerated && selectedConv.autoReplyContent && (
                        <div>
                          <label className="text-sm font-medium mb-2 block">AI Generated Reply</label>
                          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                            <div className="flex gap-2 mb-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                                Reply Generated
                              </span>
                            </div>
                            <Streamdown className="text-sm">{selectedConv.autoReplyContent}</Streamdown>
                          </div>
                        </div>
                      )}

                      {/* Last Message Time */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">Last Message</label>
                        <p className="text-sm text-muted-foreground">
                          {new Date(selectedConv.lastMessageAt).toLocaleString()}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-4 border-t">
                        {!selectedConv.autoReplyGenerated && (
                          <Button
                            onClick={() => handleGenerateReply(selectedConv.id)}
                            disabled={generateReplyMutation.isPending}
                            className="flex-1"
                          >
                            {generateReplyMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              "Generate Reply"
                            )}
                          </Button>
                        )}
                        {selectedConv.autoReplyGenerated && !selectedConv.flaggedForReview && (
                          <Button
                            variant="outline"
                            onClick={() => handleFlagForReview(selectedConv.id)}
                            disabled={flagForReviewMutation.isPending}
                            className="flex-1"
                          >
                            {flagForReviewMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Flagging...
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-4 w-4 mr-2" />
                                Flag for Review
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-muted-foreground">Select a conversation to view details</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="flagged" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Flagged for Review</CardTitle>
                <CardDescription>Conversations requiring manual review</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredConversations.filter((c) => c.flaggedForReview).length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
                    <p className="text-sm text-muted-foreground">All conversations are good to go!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredConversations
                      .filter((c) => c.flaggedForReview)
                      .map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => setSelectedConversation(conv.id)}
                          className="w-full text-left p-3 rounded-lg border hover:bg-secondary transition-colors"
                        >
                          <div className="font-medium text-sm">{conv.customerPhone}</div>
                          <div className="text-xs text-muted-foreground">Last: {new Date(conv.lastMessageAt).toLocaleTimeString()}</div>
                        </button>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
